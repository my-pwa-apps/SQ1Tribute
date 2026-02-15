// ============================================================
// STAR SWEEPER - WebXR VR Support (Immersive Diorama Mode)
// Quest 3S compatible: stand inside Sierra adventure rooms
// ============================================================
//
// Architecture: The game's 2D canvas is rendered to an OffscreenCanvas
// (immune to Quest browser page throttling), then uploaded as a
// WebGL texture and projected onto an inward-facing cylinder mesh.
// A visible, DOM-attached <canvas> provides the WebGL context that
// the XRWebGLLayer binds to (Quest requirement).
//
// Controls (Quest Touch):
//   Trigger       = click / interact at laser target
//   Grip/Squeeze  = cycle action (Walk/Look/Get/Use/Talk)
//   A button      = skip cutscene / start game / restart
//   B button      = quick-look at laser target
//   Thumbstick LR = cycle selected inventory item (in Use mode)
// ============================================================

class VRSystem {
    constructor(engine) {
        this.engine = engine;

        // --- XR state ---
        this.xrSession = null;
        this.xrRefSpace = null;
        this.gl = null;
        this.vrCanvas = null;           // Visible DOM canvas for WebGL/XR
        this.xrLayer = null;

        // --- Offscreen 2D canvas for game rendering ---
        this.offCanvas = null;
        this.offCtx = null;

        // --- Panorama geometry ---
        this.backdropRadius = 4.0;      // metres
        this.backdropArcDeg = 170;      // horizontal wrap angle
        this.backdropTop = 3.2;
        this.backdropBottom = -0.3;
        this.hSegs = 64;
        this.vSegs = 32;

        // --- Floor ---
        this.floorSize = 8.0;

        // --- GL resources ---
        this.texProg = null;
        this.markerProg = null;
        this.lineProg = null;
        this.gameTex = null;
        this.floorTex = null;
        this.backdropVBO = null;
        this.backdropCount = 0;
        this.floorVBO = null;
        this.floorCount = 0;
        this.dynVBO = null;             // Shared dynamic buffer (lasers, cursor)
        this.markerVBO = null;

        // Uniform caches
        this.texU = {};
        this.mkU = {};
        this.lnU = {};

        // --- Controller state ---
        this.ctrls = [null, null];      // [left, right]
        this.prevTrig = [false, false];
        this.prevGrip = [false, false];
        this.prevA = [false, false];
        this.prevB = [false, false];
        this.prevThumbLR = [0, 0];
        this.activeIdx = -1;
        this.hitDist = 5.0;
        this.hitThisFrame = false;
        this.pointedHS = null;
        this.curCX = -1;
        this.curCY = -1;

        // --- Action cycling ---
        this.actions = ['walk', 'look', 'get', 'use', 'talk'];
        this.actIdx = 0;

        // --- Marker data (rebuilt each frame) ---
        this.mkData = [];

        // --- Scratch matrices ---
        this.mModel = new Float32Array(16);

        // --- Stars list (ambient background particles) ---
        this.stars = [];
        for (let i = 0; i < 300; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 18 + Math.random() * 4;
            this.stars.push(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta),
                0.4 + Math.random() * 0.6,             // brightness
                0.4 + Math.random() * 0.6,
                0.5 + Math.random() * 0.5,
                0.5 + Math.random() * 0.5              // alpha
            );
        }
        this.starVBO = null;

        this.vrSupported = false;
        this._checkSupport();
    }

    // ---- Check & expose VR button ----

    async _checkSupport() {
        if (!navigator.xr) return;
        try {
            this.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
            if (this.vrSupported) this._addButton();
        } catch (e) { /* no VR */ }
    }

    _addButton() {
        const bar = document.getElementById('save-load-bar');
        if (!bar) return;
        const b = document.createElement('button');
        b.className = 'save-btn';
        b.id = 'btn-vr';
        b.title = 'Enter VR (Quest 3S)';
        b.textContent = 'Enter VR';
        b.style.cssText = 'background:#006600;border-color:#00AA00;';
        b.addEventListener('click', () => this.enterVR());
        bar.appendChild(b);
    }

    // ===========================================================
    // WebGL init (called once, on first VR entry)
    // ===========================================================

    _initGL() {
        // 1. Create a VISIBLE canvas in the DOM (Quest requires this)
        this.vrCanvas = document.createElement('canvas');
        this.vrCanvas.id = 'vr-gl-canvas';
        this.vrCanvas.style.cssText =
            'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;';
        document.body.appendChild(this.vrCanvas);

        // 2. Get WebGL2 context (xrCompatible hint)
        this.gl = this.vrCanvas.getContext('webgl2', {
            xrCompatible: true,
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: true
        });
        if (!this.gl) { console.error('VR: WebGL2 unavailable'); return false; }

        // 3. Create offscreen canvas for 2D game rendering
        //    (Works even when Quest throttles the visible page)
        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width = 640;
        this.offCanvas.height = 400;
        this.offCtx = this.offCanvas.getContext('2d');

        this._buildShaders();
        this._buildBackdrop();
        this._buildFloor();
        this._buildStarVBO();

        const gl = this.gl;
        this.dynVBO = gl.createBuffer();
        this.markerVBO = gl.createBuffer();
        this._createTextures();
        return true;
    }

    // --- Shaders ---

    _buildShaders() {
        const gl = this.gl;

        // Textured surface (backdrop, floor)
        this.texProg = this._prog(
            `#version 300 es
            in vec3 aP; in vec2 aT;
            uniform mat4 uProj, uView, uModel;
            out vec2 vT;
            void main(){ gl_Position = uProj * uView * uModel * vec4(aP,1); vT = aT; }`,
            `#version 300 es
            precision mediump float;
            in vec2 vT; uniform sampler2D uTex; uniform float uBr;
            out vec4 o;
            void main(){ vec4 c=texture(uTex,vT); o=vec4(c.rgb*uBr,c.a); }`
        );
        this.texU = this._locs(this.texProg, ['uProj','uView','uModel','uTex','uBr']);

        // Point-sprite markers (hotspots)
        this.markerProg = this._prog(
            `#version 300 es
            in vec3 aP; in vec4 aC;
            uniform mat4 uProj, uView; uniform float uSz;
            out vec4 vC;
            void main(){
                vec4 p=uProj*uView*vec4(aP,1); gl_Position=p;
                gl_PointSize=clamp(uSz*300.0/max(p.w,.1),4.0,64.0); vC=aC;
            }`,
            `#version 300 es
            precision mediump float;
            in vec4 vC; out vec4 o;
            void main(){
                float d=length(gl_PointCoord-vec2(.5));
                if(d>.5) discard;
                float g=smoothstep(.5,.0,d);
                float r=smoothstep(.35,.3,d)-smoothstep(.45,.4,d);
                o=vec4(vC.rgb,(g*.5+r*.8)*vC.a);
            }`
        );
        this.mkU = this._locs(this.markerProg, ['uProj','uView','uSz']);

        // Lines / lasers (also reused for stars background)
        this.lineProg = this._prog(
            `#version 300 es
            in vec3 aP; in vec4 aC;
            uniform mat4 uProj, uView; uniform float uSz;
            out vec4 vC;
            void main(){
                vec4 p=uProj*uView*vec4(aP,1); gl_Position=p;
                gl_PointSize=clamp(uSz*80.0/max(p.w,.1),1.0,6.0); vC=aC;
            }`,
            `#version 300 es
            precision mediump float;
            in vec4 vC; out vec4 o;
            uniform int uMode; uniform vec4 uColor;
            void main(){
                if(uMode==1){ o=uColor; }
                else {
                    float d=length(gl_PointCoord-vec2(.5));
                    if(d>.5) discard;
                    o=vec4(vC.rgb, vC.a*smoothstep(.5,.0,d));
                }
            }`
        );
        this.lnU = this._locs(this.lineProg, ['uProj','uView','uSz','uMode','uColor']);
    }

    _prog(vs, fs) {
        const gl = this.gl;
        const v = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(v, vs); gl.compileShader(v);
        if (!gl.getShaderParameter(v, gl.COMPILE_STATUS))
            console.error('VR VS:', gl.getShaderInfoLog(v));

        const f = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(f, fs); gl.compileShader(f);
        if (!gl.getShaderParameter(f, gl.COMPILE_STATUS))
            console.error('VR FS:', gl.getShaderInfoLog(f));

        const p = gl.createProgram();
        gl.attachShader(p, v); gl.attachShader(p, f);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            console.error('VR link:', gl.getProgramInfoLog(p));
        return p;
    }

    _locs(prog, names) {
        const m = {};
        for (const n of names) m[n] = this.gl.getUniformLocation(prog, n);
        return m;
    }

    // --- Geometry ---

    _buildBackdrop() {
        const gl = this.gl, R = this.backdropRadius;
        const arc = this.backdropArcDeg * Math.PI / 180;
        const sa = -arc / 2, H = this.hSegs, V = this.vSegs;
        const top = this.backdropTop, bot = this.backdropBottom;

        const grid = [];
        for (let j = 0; j <= V; j++) {
            const v = j / V, y = top + (bot - top) * v;
            for (let i = 0; i <= H; i++) {
                const u = i / H, a = sa + arc * u;
                grid.push(R * Math.sin(a), y, -R * Math.cos(a), u, v);
            }
        }
        const verts = [], s = H + 1;
        for (let j = 0; j < V; j++) for (let i = 0; i < H; i++) {
            const idx = [j * s + i, j * s + i + 1, (j+1) * s + i, (j+1) * s + i + 1]
                .map(k => k * 5);
            const [a, b, c, d] = idx;
            // CW winding from inside (inward-facing)
            for (const k of [a,c,b, b,c,d])
                verts.push(grid[k], grid[k+1], grid[k+2], grid[k+3], grid[k+4]);
        }
        this.backdropCount = verts.length / 5;
        this.backdropVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.backdropVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    }

    _buildFloor() {
        const gl = this.gl, s = this.floorSize / 2, uv = 4.0;
        const v = new Float32Array([
            -s,0,-s, 0,0,       s,0,-s, uv,0,      s,0,s, uv,uv,
            -s,0,-s, 0,0,       s,0,s,  uv,uv,    -s,0,s, 0,uv
        ]);
        this.floorCount = 6;
        this.floorVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.floorVBO);
        gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    }

    _buildStarVBO() {
        const gl = this.gl;
        this.starVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.starVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.stars), gl.STATIC_DRAW);
    }

    _createTextures() {
        const gl = this.gl;

        // Game panorama texture
        this.gameTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.gameTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // pixelated
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // Initialise with a 1x1 pixel so it's valid immediately
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,40,255]));

        // Floor grid texture (procedural)
        const fc = document.createElement('canvas');
        fc.width = 256; fc.height = 256;
        const fx = fc.getContext('2d');
        fx.fillStyle = '#050510'; fx.fillRect(0, 0, 256, 256);
        fx.strokeStyle = 'rgba(30,30,80,0.5)'; fx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
            fx.beginPath(); fx.moveTo(i,0); fx.lineTo(i,256); fx.stroke();
            fx.beginPath(); fx.moveTo(0,i); fx.lineTo(256,i); fx.stroke();
        }
        fx.strokeStyle = 'rgba(50,50,120,0.4)'; fx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 128) {
            fx.beginPath(); fx.moveTo(i,0); fx.lineTo(i,256); fx.stroke();
            fx.beginPath(); fx.moveTo(0,i); fx.lineTo(256,i); fx.stroke();
        }
        this.floorTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.floorTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fc);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    // ===========================================================
    // Session lifecycle
    // ===========================================================

    async enterVR() {
        if (!this.vrSupported) {
            this.engine.showMessage('VR not supported on this device.');
            return;
        }
        if (!this.gl && !this._initGL()) {
            this.engine.showMessage('WebGL init failed for VR.');
            return;
        }

        try {
            // Ensure context is XR compatible (critical for Quest)
            await this.gl.makeXRCompatible();

            this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking']
            });

            this.xrSession.addEventListener('end', () => this._onEnd());
            this.xrSession.addEventListener('inputsourceschange',
                (e) => this._onSources(e));

            this.xrLayer = new XRWebGLLayer(this.xrSession, this.gl);
            await this.xrSession.updateRenderState({ baseLayer: this.xrLayer });
            this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');

            // Redirect engine drawing to the offscreen canvas
            this.engine._origCanvas = this.engine.canvas;
            this.engine._origCtx = this.engine.ctx;
            this.engine.canvas = this.offCanvas;
            this.engine.ctx = this.offCtx;

            this.engine.vrActive = true;
            this.engine.playerVisible = false;

            // Start XR render loop
            this.xrSession.requestAnimationFrame((t, f) => this._xrFrame(t, f));

            this.engine.showMessage(
                'VR active! Trigger=interact, Grip=change action, A=confirm.');

            const btn = document.getElementById('btn-vr');
            if (btn) {
                btn.textContent = 'Exit VR';
                btn.style.cssText = 'background:#660000;border-color:#AA0000;';
                btn.onclick = () => this.exitVR();
            }
        } catch (e) {
            console.error('VR session failed:', e);
            this.engine.showMessage('VR failed: ' + e.message);
        }
    }

    async exitVR() { if (this.xrSession) await this.xrSession.end(); }

    _onEnd() {
        this.xrSession = null;
        // Restore original canvas
        if (this.engine._origCanvas) {
            this.engine.canvas = this.engine._origCanvas;
            this.engine.ctx = this.engine._origCtx;
            this.engine._origCanvas = null;
            this.engine._origCtx = null;
        }
        this.engine.vrActive = false;
        this.engine.playerVisible = true;
        this.ctrls = [null, null];

        const btn = document.getElementById('btn-vr');
        if (btn) {
            btn.textContent = 'Enter VR';
            btn.style.cssText = 'background:#006600;border-color:#00AA00;';
            btn.onclick = () => this.enterVR();
        }
    }

    _onSources(e) {
        for (const s of e.added)
            this.ctrls[s.handedness === 'left' ? 0 : 1] = s;
        for (const s of e.removed) {
            const i = s.handedness === 'left' ? 0 : 1;
            if (this.ctrls[i] === s) this.ctrls[i] = null;
        }
    }

    // ===========================================================
    // XR frame callback
    // ===========================================================

    _xrFrame(timestamp, frame) {
        const session = this.xrSession;
        if (!session) return;
        session.requestAnimationFrame((t, f) => this._xrFrame(t, f));

        const gl = this.gl;
        const pose = frame.getViewerPose(this.xrRefSpace);
        if (!pose) return;

        // 1. Engine update
        const dt = Math.min(timestamp - this.engine.lastTime, 100);
        this.engine.lastTime = timestamp;
        this.engine.update(dt);

        // 2. Engine render to offscreen 2D canvas
        this.engine.render();

        // 3. Upload offscreen canvas to GPU texture
        gl.bindTexture(gl.TEXTURE_2D, this.gameTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, this.offCanvas);

        // 4. Controller input
        this._processInput(frame);

        // 5. Hotspot markers
        this._buildMarkers();

        // 6. Render stereo views
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.xrLayer.framebuffer);
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        for (const view of pose.views) {
            const vp = this.xrLayer.getViewport(view);
            gl.viewport(vp.x, vp.y, vp.width, vp.height);
            gl.clearColor(0.01, 0.01, 0.03, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const P = view.projectionMatrix;
            const V = view.transform.inverse.matrix;

            this._drawStars(P, V);
            this._drawTextured(this.backdropVBO, this.backdropCount, this.gameTex, P, V, 1.15);
            this._drawTextured(this.floorVBO, this.floorCount, this.floorTex, P, V, 1.0);
            this._drawMarkers(P, V);
            this._drawLasers(frame, P, V);
        }
    }

    // ===========================================================
    // Drawing helpers
    // ===========================================================

    _drawTextured(vbo, cnt, tex, P, V, br) {
        const gl = this.gl;
        gl.useProgram(this.texProg);
        _m4id(this.mModel);
        gl.uniformMatrix4fv(this.texU.uProj, false, P);
        gl.uniformMatrix4fv(this.texU.uView, false, V);
        gl.uniformMatrix4fv(this.texU.uModel, false, this.mModel);
        gl.uniform1i(this.texU.uTex, 0);
        gl.uniform1f(this.texU.uBr, br);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        const a0 = gl.getAttribLocation(this.texProg, 'aP');
        const a1 = gl.getAttribLocation(this.texProg, 'aT');
        gl.enableVertexAttribArray(a0);
        gl.vertexAttribPointer(a0, 3, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(a1);
        gl.vertexAttribPointer(a1, 2, gl.FLOAT, false, 20, 12);
        gl.drawArrays(gl.TRIANGLES, 0, cnt);
        gl.disableVertexAttribArray(a0);
        gl.disableVertexAttribArray(a1);
    }

    _drawStars(P, V) {
        const gl = this.gl;
        gl.useProgram(this.lineProg);
        gl.uniformMatrix4fv(this.lnU.uProj, false, P);
        gl.uniformMatrix4fv(this.lnU.uView, false, V);
        gl.uniform1f(this.lnU.uSz, 1.0);
        gl.uniform1i(this.lnU.uMode, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.starVBO);
        const a0 = gl.getAttribLocation(this.lineProg, 'aP');
        const a1 = gl.getAttribLocation(this.lineProg, 'aC');
        gl.enableVertexAttribArray(a0);
        gl.vertexAttribPointer(a0, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(a1);
        gl.vertexAttribPointer(a1, 4, gl.FLOAT, false, 28, 12);
        gl.depthMask(false);
        gl.drawArrays(gl.POINTS, 0, this.stars.length / 7);
        gl.depthMask(true);
        gl.disableVertexAttribArray(a0);
        gl.disableVertexAttribArray(a1);
    }

    _drawMarkers(P, V) {
        if (!this.mkData.length) return;
        const gl = this.gl;
        gl.useProgram(this.markerProg);
        gl.uniformMatrix4fv(this.mkU.uProj, false, P);
        gl.uniformMatrix4fv(this.mkU.uView, false, V);
        gl.uniform1f(this.mkU.uSz, 1.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.markerVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mkData), gl.DYNAMIC_DRAW);
        const a0 = gl.getAttribLocation(this.markerProg, 'aP');
        const a1 = gl.getAttribLocation(this.markerProg, 'aC');
        gl.enableVertexAttribArray(a0);
        gl.vertexAttribPointer(a0, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(a1);
        gl.vertexAttribPointer(a1, 4, gl.FLOAT, false, 28, 12);
        gl.depthMask(false);
        gl.drawArrays(gl.POINTS, 0, this.mkData.length / 7);
        gl.depthMask(true);
        gl.disableVertexAttribArray(a0);
        gl.disableVertexAttribArray(a1);
    }

    _drawLasers(frame, P, V) {
        const gl = this.gl;
        gl.useProgram(this.lineProg);
        gl.uniformMatrix4fv(this.lnU.uProj, false, P);
        gl.uniformMatrix4fv(this.lnU.uView, false, V);
        gl.uniform1f(this.lnU.uSz, 1.0);
        gl.uniform1i(this.lnU.uMode, 1);    // Solid color line mode

        for (let i = 0; i < 2; i++) {
            const src = this.ctrls[i];
            if (!src || !src.targetRaySpace) continue;
            const rp = frame.getPose(src.targetRaySpace, this.xrRefSpace);
            if (!rp) continue;

            const o = rp.transform.position;
            const d = this._rayDir(rp.transform);
            const active = this.hitThisFrame && i === this.activeIdx;
            const len = active ? this.hitDist : 5.0;

            const color = active ? [0.1,1,0.3,0.85] : [0.2,0.4,1,0.6];
            gl.uniform4fv(this.lnU.uColor, color);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.dynVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                o.x, o.y, o.z,
                o.x + d[0]*len, o.y + d[1]*len, o.z + d[2]*len
            ]), gl.DYNAMIC_DRAW);

            const a0 = gl.getAttribLocation(this.lineProg, 'aP');
            gl.enableVertexAttribArray(a0);
            gl.vertexAttribPointer(a0, 3, gl.FLOAT, false, 0, 0);
            // Disable color attrib (not used in line mode)
            const a1 = gl.getAttribLocation(this.lineProg, 'aC');
            if (a1 >= 0) gl.disableVertexAttribArray(a1);
            gl.drawArrays(gl.LINES, 0, 2);
            gl.disableVertexAttribArray(a0);
        }
    }

    // ===========================================================
    // Hotspot markers
    // ===========================================================

    _buildMarkers() {
        this.mkData = [];
        const room = this.engine.rooms[this.engine.currentRoomId];
        if (!room || !room.hotspots) return;
        const pulse = (Math.sin(Date.now() * 0.004) + 1) * 0.25 + 0.5;

        for (const hs of room.hotspots) {
            if (hs.hidden) continue;
            const p = this._c2w(hs.x + hs.w / 2, hs.y + hs.h / 2);
            const pull = 0.93;

            let r, g, b, a;
            if (hs.isExit)       { r=0.15; g=1; b=0.3; a=pulse; }
            else if (hs.get)     { r=0.3; g=0.7; b=1; a=pulse; }
            else if (hs.talk)    { r=1; g=0.8; b=0.2; a=pulse*0.8; }
            else                 { r=0.9; g=0.9; b=0.5; a=pulse*0.6; }
            if (this.pointedHS === hs) {
                r = Math.min(1, r+0.4); g = Math.min(1, g+0.4);
                b = Math.min(1, b+0.4); a = 1;
            }
            this.mkData.push(p.x*pull, p.y, p.z*pull, r, g, b, a);
        }
    }

    _c2w(cx, cy) {
        const R = this.backdropRadius;
        const arc = this.backdropArcDeg * Math.PI / 180;
        const sa = -arc / 2;
        const u = cx / 640, v = cy / 400;
        const angle = sa + arc * u;
        return {
            x: R * Math.sin(angle),
            y: this.backdropTop + (this.backdropBottom - this.backdropTop) * v,
            z: -R * Math.cos(angle)
        };
    }

    // ===========================================================
    // Controller input
    // ===========================================================

    _processInput(frame) {
        this.hitThisFrame = false;
        this.pointedHS = null;
        this.activeIdx = -1;
        this.hitDist = 5.0;

        for (let i = 0; i < 2; i++) {
            const src = this.ctrls[i];
            if (!src || !src.targetRaySpace) continue;
            const rp = frame.getPose(src.targetRaySpace, this.xrRefSpace);
            if (!rp) continue;

            const o = rp.transform.position;
            const d = this._rayDir(rp.transform);
            const hit = this._rayCyl([o.x, o.y, o.z], d);

            if (hit) {
                this.hitThisFrame = true;
                this.activeIdx = i;
                this.hitDist = hit.t;
                this.curCX = hit.cx; this.curCY = hit.cy;
                this.engine.mouseX = hit.cx;
                this.engine.mouseY = hit.cy;
                const room = this.engine.rooms[this.engine.currentRoomId];
                if (room) this.pointedHS = this.engine.findHotspot(hit.cx, hit.cy, room);
            }

            const gp = src.gamepad;
            if (!gp) continue;

            // Trigger
            const trig = gp.buttons[0] && gp.buttons[0].pressed;
            if (trig && !this.prevTrig[i]) this._onTrig(hit);
            this.prevTrig[i] = trig;

            // Grip
            const grip = gp.buttons[1] && gp.buttons[1].pressed;
            if (grip && !this.prevGrip[i]) this._cycleAct();
            this.prevGrip[i] = grip;

            // A button
            const aBtn = gp.buttons.length > 4 && gp.buttons[4] && gp.buttons[4].pressed;
            if (aBtn && !this.prevA[i]) {
                if (this.engine.cutscene) { this.engine.skipCutscene(); this.engine.playerVisible = false; }
                else if (this.engine.titleScreen) {
                    this.engine.titleScreen = false; this.engine.sound.gameStart();
                    this.engine.goToRoom('broom_closet', 320, 310); this.engine.playerVisible = false;
                } else if (this.engine.dead || this.engine.won) {
                    this.engine.restart(); this.engine.playerVisible = false;
                }
            }
            this.prevA[i] = !!aBtn;

            // B button = quick-look
            const bBtn = gp.buttons.length > 5 && gp.buttons[5] && gp.buttons[5].pressed;
            if (bBtn && !this.prevB[i] && hit) {
                const prev = this.engine.currentAction;
                this.engine.currentAction = 'look';
                this.engine.handleClick(hit.cx, hit.cy);
                this.engine.currentAction = prev;
                this.engine.playerVisible = false;
            }
            this.prevB[i] = !!bBtn;

            // Thumbstick X = cycle inventory in Use mode
            if (gp.axes && gp.axes.length >= 4) {
                const tx = gp.axes[2];
                const wasOver = Math.abs(this.prevThumbLR[i]) > 0.6;
                const nowOver = Math.abs(tx) > 0.6;
                if (nowOver && !wasOver && this.engine.currentAction === 'use'
                    && this.engine.inventory.length > 0) {
                    const inv = this.engine.inventory;
                    const dir = tx > 0 ? 1 : -1;
                    const cur = inv.indexOf(this.engine.selectedItem);
                    const next = (cur + dir + inv.length) % inv.length;
                    this.engine.selectedItem = inv[next];
                    this.engine.showMessage('Using: ' + (this.engine.items[inv[next]]?.name || inv[next]));
                    this.engine.updateInventoryUI();
                }
                this.prevThumbLR[i] = tx;
            }
        }
    }

    _onTrig(hit) {
        this.engine.sound.init();

        if (this.engine.titleScreen) {
            this.engine.titleScreen = false;
            this.engine.sound.gameStart();
            this.engine.goToRoom('broom_closet', 320, 310);
            this.engine.playerVisible = false;
            return;
        }
        if (this.engine.dead || this.engine.won) {
            this.engine.restart(); this.engine.playerVisible = false; return;
        }
        if (this.engine.cutscene) {
            this.engine.skipCutscene(); this.engine.playerVisible = false; return;
        }
        if (!hit) return;

        // Instant exit transitions in VR (skip walk animation)
        if (this.engine.currentAction === 'walk' && this.pointedHS && this.pointedHS.isExit) {
            const hs = this.pointedHS;
            if (hs.walkToX !== undefined) this.engine.playerX = hs.walkToX;
            if (hs.walkToY !== undefined) this.engine.playerY = hs.walkToY;
            if (hs.onExit) hs.onExit(this.engine);
            this.engine.playerVisible = false;
            return;
        }

        this.engine.handleClick(hit.cx, hit.cy);
        if (!this.engine.cutscene) this.engine.playerVisible = false;
    }

    _cycleAct() {
        this.actIdx = (this.actIdx + 1) % this.actions.length;
        this.engine.setAction(this.actions[this.actIdx]);
    }

    // ===========================================================
    // Raycasting
    // ===========================================================

    _rayDir(transform) {
        const q = transform.orientation;
        return [
            -(2 * (q.x * q.z + q.w * q.y)),
            -(2 * (q.y * q.z - q.w * q.x)),
            -(1 - 2 * (q.x * q.x + q.y * q.y))
        ];
    }

    _rayCyl(o, d) {
        const R = this.backdropRadius;
        const a = d[0]*d[0] + d[2]*d[2];
        if (a < 1e-8) return null;
        const b = 2 * (o[0]*d[0] + o[2]*d[2]);
        const c = o[0]*o[0] + o[2]*o[2] - R*R;
        const disc = b*b - 4*a*c;
        if (disc < 0) return null;
        const sq = Math.sqrt(disc);
        let t1 = (-b - sq) / (2*a), t2 = (-b + sq) / (2*a);
        let t = (t1 > 0.01 && t1 < t2) ? t1 : t2;
        if (t <= 0.01) return null;

        const hx = o[0]+t*d[0], hy = o[1]+t*d[1], hz = o[2]+t*d[2];
        if (hy < this.backdropBottom || hy > this.backdropTop) return null;

        const angle = Math.atan2(hx, -hz);
        const half = (this.backdropArcDeg / 2) * Math.PI / 180;
        if (angle < -half || angle > half) return null;

        const u = (angle + half) / (2 * half);
        const v = (hy - this.backdropTop) / (this.backdropBottom - this.backdropTop);
        return {
            t,
            cx: Math.round(Math.max(0, Math.min(640, u * 640))),
            cy: Math.round(Math.max(0, Math.min(400, v * 400)))
        };
    }
}

// ---- tiny mat4 identity ----
function _m4id(o) { o.fill(0); o[0]=o[5]=o[10]=o[15]=1; }
