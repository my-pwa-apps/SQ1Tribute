// ============================================================
// STAR SWEEPER - WebXR VR Support (Immersive Diorama Mode)
// Renders the 2D game inside a curved panoramic backdrop
// with 3D hotspot markers and controller laser interaction
// Stand INSIDE the Sierra adventure rooms on Quest 3S
// ============================================================

class VRSystem {
    constructor(engine) {
        this.engine = engine;
        this.xrSession = null;
        this.xrRefSpace = null;
        this.gl = null;
        this.glCanvas = null;
        this.xrLayer = null;

        // Panoramic backdrop: curved half-cylinder wrapping around the player
        this.backdropRadius = 4.0;       // meters
        this.backdropArcDeg = 170;       // degrees of horizontal wrap
        this.backdropTop = 3.2;          // top edge height (meters)
        this.backdropBottom = -0.3;      // bottom edge (slightly below floor)
        this.hSegs = 64;                 // horizontal mesh segments
        this.vSegs = 32;                 // vertical mesh segments

        // Floor
        this.floorSize = 8.0;           // meters on each side

        // Shader programs
        this.texProgram = null;          // Textured surfaces (backdrop, floor)
        this.markerProgram = null;       // GL_POINTS hotspot markers
        this.lineProgram = null;         // Laser beam lines

        // Textures
        this.gameTexture = null;         // Game canvas -> panorama
        this.floorTexture = null;        // Dark grid floor

        // Geometry buffers
        this.backdropVBO = null;
        this.backdropVertCount = 0;
        this.floorVBO = null;
        this.floorVertCount = 0;
        this.laserVBO = null;
        this.markerVBO = null;

        // Controller state
        this.controllers = [null, null]; // [left, right]
        this.lastTrigger = [false, false];
        this.lastSqueeze = [false, false];
        this.lastAButton = [false, false];
        this.activeCtrlIdx = -1;
        this.hitDist = 5.0;
        this.hitScreenThisFrame = false;
        this.pointedHotspot = null;
        this.cursorCanvasX = -1;
        this.cursorCanvasY = -1;

        // Action cycling via grip button
        this.actions = ['walk', 'look', 'get', 'use', 'talk'];
        this.actionIndex = 0;

        // Hotspot marker data: [x,y,z, r,g,b,a, ...] per visible hotspot
        this.markerData = [];

        // Scratch matrix
        this.modelMatrix = new Float32Array(16);

        // Uniform location caches (populated after shader compile)
        this.texU = {};
        this.markerU = {};
        this.lineU = {};

        this.vrSupported = false;
        this.checkVRSupport();
    }

    // ===============================
    // VR Availability & Button
    // ===============================

    async checkVRSupport() {
        if (!navigator.xr) return;
        try {
            this.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
            if (this.vrSupported) this.showEnterVRButton();
        } catch (e) {
            console.log('VR check failed:', e);
        }
    }

    showEnterVRButton() {
        const bar = document.getElementById('save-load-bar');
        if (!bar) return;
        const btn = document.createElement('button');
        btn.className = 'save-btn';
        btn.id = 'btn-vr';
        btn.title = 'Enter VR (Quest 3S)';
        btn.textContent = 'Enter VR';
        btn.style.background = '#006600';
        btn.style.borderColor = '#00AA00';
        btn.addEventListener('click', () => this.enterVR());
        bar.appendChild(btn);
    }

    // ===============================
    // WebGL Initialization
    // ===============================

    initWebGL() {
        this.glCanvas = document.createElement('canvas');
        this.gl = this.glCanvas.getContext('webgl2', { xrCompatible: true, alpha: false });
        if (!this.gl) { console.error('WebGL2 not available for VR'); return false; }

        this.buildShaders();
        this.buildBackdropMesh();
        this.buildFloorMesh();

        // Dynamic buffers
        this.laserVBO = this.gl.createBuffer();
        this.markerVBO = this.gl.createBuffer();

        this.createTextures();
        return true;
    }

    buildShaders() {
        const gl = this.gl;

        // ---- Textured surface shader (backdrop panorama, floor) ----
        const vsT = `#version 300 es
            in vec3 aPos;
            in vec2 aUV;
            uniform mat4 uProj, uView, uModel;
            out vec2 vUV;
            void main() {
                gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
                vUV = aUV;
            }
        `;
        const fsT = `#version 300 es
            precision mediump float;
            in vec2 vUV;
            uniform sampler2D uTex;
            uniform float uBright;
            out vec4 oColor;
            void main() {
                vec4 c = texture(uTex, vUV);
                oColor = vec4(c.rgb * uBright, c.a);
            }
        `;
        this.texProgram = this.compileProgram(vsT, fsT);
        this.texU = this.locateUniforms(this.texProgram,
            ['uProj', 'uView', 'uModel', 'uTex', 'uBright']);

        // ---- Hotspot marker shader (glowing point sprites) ----
        const vsM = `#version 300 es
            in vec3 aPos;
            in vec4 aColor;
            uniform mat4 uProj, uView;
            uniform float uSize;
            out vec4 vColor;
            void main() {
                vec4 p = uProj * uView * vec4(aPos, 1.0);
                gl_Position = p;
                gl_PointSize = clamp(uSize * 300.0 / max(p.w, 0.1), 4.0, 64.0);
                vColor = aColor;
            }
        `;
        const fsM = `#version 300 es
            precision mediump float;
            in vec4 vColor;
            out vec4 oColor;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float glow = smoothstep(0.5, 0.0, d);
                float ring = smoothstep(0.35, 0.3, d) - smoothstep(0.45, 0.4, d);
                oColor = vec4(vColor.rgb, (glow * 0.5 + ring * 0.8) * vColor.a);
            }
        `;
        this.markerProgram = this.compileProgram(vsM, fsM);
        this.markerU = this.locateUniforms(this.markerProgram,
            ['uProj', 'uView', 'uSize']);

        // ---- Laser beam shader (solid color lines) ----
        const vsL = `#version 300 es
            in vec3 aPos;
            uniform mat4 uProj, uView;
            void main() {
                gl_Position = uProj * uView * vec4(aPos, 1.0);
            }
        `;
        const fsL = `#version 300 es
            precision mediump float;
            uniform vec4 uColor;
            out vec4 oColor;
            void main() {
                oColor = uColor;
            }
        `;
        this.lineProgram = this.compileProgram(vsL, fsL);
        this.lineU = this.locateUniforms(this.lineProgram,
            ['uProj', 'uView', 'uColor']);
    }

    compileProgram(vsSrc, fsSrc) {
        const gl = this.gl;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vsSrc);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS))
            console.error('VR vertex shader:', gl.getShaderInfoLog(vs));

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fsSrc);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS))
            console.error('VR fragment shader:', gl.getShaderInfoLog(fs));

        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
            console.error('VR shader link:', gl.getProgramInfoLog(prog));
        return prog;
    }

    locateUniforms(prog, names) {
        const gl = this.gl;
        const map = {};
        for (const n of names) map[n] = gl.getUniformLocation(prog, n);
        return map;
    }

    // ===============================
    // Geometry Construction
    // ===============================

    buildBackdropMesh() {
        // Generate an inward-facing half-cylinder mesh
        // Player stands at the origin, the room art wraps around them
        const gl = this.gl;
        const R = this.backdropRadius;
        const arcRad = this.backdropArcDeg * Math.PI / 180;
        const startAngle = -arcRad / 2;
        const H = this.hSegs, V = this.vSegs;
        const top = this.backdropTop, bot = this.backdropBottom;

        // Build vertex grid: each vertex has [x, y, z, u, v]
        const grid = [];
        for (let j = 0; j <= V; j++) {
            const v = j / V;
            const y = top + (bot - top) * v;
            for (let i = 0; i <= H; i++) {
                const u = i / H;
                const angle = startAngle + arcRad * u;
                grid.push(
                    R * Math.sin(angle),    // x
                    y,                       // y
                    -R * Math.cos(angle),   // z (negative = in front)
                    u,                       // tex u
                    v                        // tex v
                );
            }
        }

        // Build triangle list (inward-facing winding)
        const verts = [];
        const stride = H + 1;
        for (let j = 0; j < V; j++) {
            for (let i = 0; i < H; i++) {
                const a = (j * stride + i) * 5;
                const b = (j * stride + i + 1) * 5;
                const c = ((j + 1) * stride + i) * 5;
                const d = ((j + 1) * stride + i + 1) * 5;
                // Triangle 1: a, c, b (CW from inside = inward-facing)
                verts.push(grid[a], grid[a+1], grid[a+2], grid[a+3], grid[a+4]);
                verts.push(grid[c], grid[c+1], grid[c+2], grid[c+3], grid[c+4]);
                verts.push(grid[b], grid[b+1], grid[b+2], grid[b+3], grid[b+4]);
                // Triangle 2: b, c, d
                verts.push(grid[b], grid[b+1], grid[b+2], grid[b+3], grid[b+4]);
                verts.push(grid[c], grid[c+1], grid[c+2], grid[c+3], grid[c+4]);
                verts.push(grid[d], grid[d+1], grid[d+2], grid[d+3], grid[d+4]);
            }
        }

        this.backdropVertCount = verts.length / 5;
        this.backdropVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.backdropVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    }

    buildFloorMesh() {
        const gl = this.gl;
        const s = this.floorSize / 2;
        // Floor at y=0, UVs scaled for repeating grid pattern
        const uvScale = 4.0;
        const verts = new Float32Array([
            -s, 0, -s,   0,       0,
             s, 0, -s,   uvScale, 0,
             s, 0,  s,   uvScale, uvScale,
            -s, 0, -s,   0,       0,
             s, 0,  s,   uvScale, uvScale,
            -s, 0,  s,   0,       uvScale,
        ]);
        this.floorVertCount = 6;
        this.floorVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.floorVBO);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    }

    createTextures() {
        const gl = this.gl;

        // Game canvas texture (updated every frame from engine.canvas)
        this.gameTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); // Pixelated!
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Floor grid texture (procedural dark grid)
        const fc = document.createElement('canvas');
        fc.width = 256; fc.height = 256;
        const fctx = fc.getContext('2d');
        fctx.fillStyle = '#050510';
        fctx.fillRect(0, 0, 256, 256);
        // Minor grid lines
        fctx.strokeStyle = 'rgba(30, 30, 80, 0.5)';
        fctx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
            fctx.beginPath(); fctx.moveTo(i, 0); fctx.lineTo(i, 256); fctx.stroke();
            fctx.beginPath(); fctx.moveTo(0, i); fctx.lineTo(256, i); fctx.stroke();
        }
        // Major grid lines
        fctx.strokeStyle = 'rgba(50, 50, 120, 0.4)';
        fctx.lineWidth = 2;
        for (let i = 0; i <= 256; i += 128) {
            fctx.beginPath(); fctx.moveTo(i, 0); fctx.lineTo(i, 256); fctx.stroke();
            fctx.beginPath(); fctx.moveTo(0, i); fctx.lineTo(256, i); fctx.stroke();
        }

        this.floorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.floorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fc);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    // ===============================
    // VR Session Management
    // ===============================

    async enterVR() {
        if (!this.vrSupported) {
            this.engine.showMessage('VR not supported on this device.');
            return;
        }
        if (!this.gl && !this.initWebGL()) {
            this.engine.showMessage('Failed to initialize WebGL for VR.');
            return;
        }

        try {
            this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking']
            });

            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.xrSession.addEventListener('inputsourceschange',
                (e) => this.onInputSourcesChange(e));

            this.xrLayer = new XRWebGLLayer(this.xrSession, this.gl);
            await this.xrSession.updateRenderState({ baseLayer: this.xrLayer });
            this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');

            // Activate VR mode in engine
            this.engine.vrActive = true;
            this.engine.playerVisible = false; // First-person: hide sprite

            // Start XR render loop
            this.xrSession.requestAnimationFrame((t, f) => this.onXRFrame(t, f));

            this.engine.showMessage(
                'Welcome to VR! You are standing inside the room. ' +
                'Trigger=interact, Grip=change action, A=skip/confirm.'
            );

            const btn = document.getElementById('btn-vr');
            if (btn) {
                btn.textContent = 'Exit VR';
                btn.style.background = '#660000';
                btn.style.borderColor = '#AA0000';
                btn.onclick = () => this.exitVR();
            }
        } catch (e) {
            console.error('VR session failed:', e);
            this.engine.showMessage('Failed to enter VR: ' + e.message);
        }
    }

    async exitVR() {
        if (this.xrSession) await this.xrSession.end();
    }

    onSessionEnd() {
        this.xrSession = null;
        this.engine.vrActive = false;
        this.engine.playerVisible = true;
        this.controllers = [null, null];
        const btn = document.getElementById('btn-vr');
        if (btn) {
            btn.textContent = 'Enter VR';
            btn.style.background = '#006600';
            btn.style.borderColor = '#00AA00';
            btn.onclick = () => this.enterVR();
        }
    }

    onInputSourcesChange(event) {
        for (const s of event.added) {
            const idx = s.handedness === 'left' ? 0 : 1;
            this.controllers[idx] = s;
        }
        for (const s of event.removed) {
            const idx = s.handedness === 'left' ? 0 : 1;
            if (this.controllers[idx] === s) this.controllers[idx] = null;
        }
    }

    // ===============================
    // XR Frame Loop
    // ===============================

    onXRFrame(timestamp, frame) {
        if (!this.xrSession) return;
        this.xrSession.requestAnimationFrame((t, f) => this.onXRFrame(t, f));

        const gl = this.gl;
        const pose = frame.getViewerPose(this.xrRefSpace);
        if (!pose) return;

        // Update game logic
        const dt = Math.min(timestamp - this.engine.lastTime, 100);
        this.engine.lastTime = timestamp;
        this.engine.update(dt);

        // Render 2D game to its canvas (this becomes the panorama texture)
        this.engine.render();

        // Upload game canvas to GPU texture
        gl.bindTexture(gl.TEXTURE_2D, this.gameTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
            gl.UNSIGNED_BYTE, this.engine.canvas);

        // Process controller input (raycasts, button presses)
        this.processInput(frame);

        // Build hotspot marker data
        this.buildMarkerData();

        // Bind XR framebuffer and configure GL state
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.xrLayer.framebuffer);
        gl.disable(gl.CULL_FACE);  // Render both sides (we're inside the cylinder)
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Render for each eye (stereo)
        for (const view of pose.views) {
            const vp = this.xrLayer.getViewport(view);
            gl.viewport(vp.x, vp.y, vp.width, vp.height);
            gl.clearColor(0.015, 0.015, 0.04, 1.0); // Deep space void
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const proj = view.projectionMatrix;
            const viewMat = view.transform.inverse.matrix;

            this.drawBackdrop(proj, viewMat);
            this.drawFloor(proj, viewMat);
            this.drawMarkers(proj, viewMat);
            this.drawLasers(frame, proj, viewMat);
        }
    }

    // ===============================
    // 3D Rendering
    // ===============================

    bindAndDrawTexturedMesh(vbo, vertCount, texture, proj, viewMat, brightness) {
        const gl = this.gl;
        gl.useProgram(this.texProgram);

        mat4Identity(this.modelMatrix);
        gl.uniformMatrix4fv(this.texU.uProj, false, proj);
        gl.uniformMatrix4fv(this.texU.uView, false, viewMat);
        gl.uniformMatrix4fv(this.texU.uModel, false, this.modelMatrix);
        gl.uniform1i(this.texU.uTex, 0);
        gl.uniform1f(this.texU.uBright, brightness);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        const aPos = gl.getAttribLocation(this.texProgram, 'aPos');
        const aUV = gl.getAttribLocation(this.texProgram, 'aUV');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(aUV);
        gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 20, 12);

        gl.drawArrays(gl.TRIANGLES, 0, vertCount);

        gl.disableVertexAttribArray(aPos);
        gl.disableVertexAttribArray(aUV);
    }

    drawBackdrop(proj, viewMat) {
        // The room art wraps around you on the inside of the cylinder
        this.bindAndDrawTexturedMesh(
            this.backdropVBO, this.backdropVertCount,
            this.gameTexture, proj, viewMat, 1.15
        );
    }

    drawFloor(proj, viewMat) {
        // Dark grid floor beneath the player
        this.bindAndDrawTexturedMesh(
            this.floorVBO, this.floorVertCount,
            this.floorTexture, proj, viewMat, 1.0
        );
    }

    drawMarkers(proj, viewMat) {
        if (this.markerData.length === 0) return;
        const gl = this.gl;

        gl.useProgram(this.markerProgram);
        gl.uniformMatrix4fv(this.markerU.uProj, false, proj);
        gl.uniformMatrix4fv(this.markerU.uView, false, viewMat);
        gl.uniform1f(this.markerU.uSize, 1.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.markerVBO);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(this.markerData), gl.DYNAMIC_DRAW);

        const aPos = gl.getAttribLocation(this.markerProgram, 'aPos');
        const aColor = gl.getAttribLocation(this.markerProgram, 'aColor');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(aColor);
        gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 28, 12);

        gl.depthMask(false); // Transparent markers shouldn't write depth
        gl.drawArrays(gl.POINTS, 0, this.markerData.length / 7);
        gl.depthMask(true);

        gl.disableVertexAttribArray(aPos);
        gl.disableVertexAttribArray(aColor);
    }

    drawLasers(frame, proj, viewMat) {
        const gl = this.gl;
        gl.useProgram(this.lineProgram);
        gl.uniformMatrix4fv(this.lineU.uProj, false, proj);
        gl.uniformMatrix4fv(this.lineU.uView, false, viewMat);

        for (let i = 0; i < 2; i++) {
            const src = this.controllers[i];
            if (!src || !src.targetRaySpace) continue;

            const rayPose = frame.getPose(src.targetRaySpace, this.xrRefSpace);
            if (!rayPose) continue;

            const o = rayPose.transform.position;
            const d = this.getRayDirection(rayPose.transform);
            const isActive = this.hitScreenThisFrame && i === this.activeCtrlIdx;
            const len = isActive ? this.hitDist : 5.0;

            const endX = o.x + d[0] * len;
            const endY = o.y + d[1] * len;
            const endZ = o.z + d[2] * len;

            // Green when hitting backdrop, blue otherwise
            const color = isActive
                ? [0.1, 1.0, 0.3, 0.85]
                : [0.2, 0.4, 1.0, 0.6];
            gl.uniform4fv(this.lineU.uColor, color);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.laserVBO);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                o.x, o.y, o.z, endX, endY, endZ
            ]), gl.DYNAMIC_DRAW);

            const aPos = gl.getAttribLocation(this.lineProgram, 'aPos');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.LINES, 0, 2);
            gl.disableVertexAttribArray(aPos);
        }
    }

    // ===============================
    // Hotspot 3D Markers
    // ===============================

    buildMarkerData() {
        const room = this.engine.rooms[this.engine.currentRoomId];
        this.markerData = [];
        if (!room || !room.hotspots) return;

        const pulse = (Math.sin(Date.now() * 0.004) + 1) * 0.25 + 0.5;

        for (const hs of room.hotspots) {
            if (hs.hidden) continue;

            // Map hotspot center to 3D position on cylinder surface
            const pos = this.canvasTo3D(hs.x + hs.w / 2, hs.y + hs.h / 2);

            // Pull marker slightly in front of the backdrop surface
            const pull = 0.93;
            const mx = pos.x * pull;
            const mz = pos.z * pull;
            const my = pos.y;

            // Color-code by interaction type
            let r, g, b, a;
            if (hs.isExit) {
                r = 0.15; g = 1.0; b = 0.3; a = pulse;       // Green: exits
            } else if (hs.get) {
                r = 0.3; g = 0.7; b = 1.0; a = pulse;        // Cyan: collectibles
            } else if (hs.talk) {
                r = 1.0; g = 0.8; b = 0.2; a = pulse * 0.8;  // Gold: NPCs
            } else {
                r = 0.9; g = 0.9; b = 0.5; a = pulse * 0.6;  // Dim yellow: other
            }

            // Brighten when controller is pointing at this hotspot
            if (this.pointedHotspot === hs) {
                r = Math.min(1.0, r + 0.4);
                g = Math.min(1.0, g + 0.4);
                b = Math.min(1.0, b + 0.4);
                a = 1.0;
            }

            this.markerData.push(mx, my, mz, r, g, b, a);
        }
    }

    canvasTo3D(cx, cy) {
        // Convert 2D canvas coordinates to a 3D point on the cylinder surface
        const R = this.backdropRadius;
        const arcRad = this.backdropArcDeg * Math.PI / 180;
        const startAngle = -arcRad / 2;

        const u = cx / 640;   // 0 = left edge, 1 = right edge of canvas
        const v = cy / 400;   // 0 = top, 1 = bottom

        const angle = startAngle + arcRad * u;
        const y = this.backdropTop + (this.backdropBottom - this.backdropTop) * v;
        const x = R * Math.sin(angle);
        const z = -R * Math.cos(angle);

        return { x, y, z };
    }

    // ===============================
    // Controller Input
    // ===============================

    processInput(frame) {
        this.hitScreenThisFrame = false;
        this.pointedHotspot = null;
        this.activeCtrlIdx = -1;
        this.hitDist = 5.0;

        for (let i = 0; i < 2; i++) {
            const src = this.controllers[i];
            if (!src || !src.targetRaySpace) continue;

            const rayPose = frame.getPose(src.targetRaySpace, this.xrRefSpace);
            if (!rayPose) continue;

            const o = rayPose.transform.position;
            const d = this.getRayDirection(rayPose.transform);
            const origin = [o.x, o.y, o.z];

            // Raycast against the cylindrical backdrop
            const hit = this.rayCylinderIntersect(origin, d);
            if (hit) {
                this.hitScreenThisFrame = true;
                this.activeCtrlIdx = i;
                this.hitDist = hit.t;
                this.cursorCanvasX = hit.cx;
                this.cursorCanvasY = hit.cy;

                // Feed hover coordinates to engine (for hotspot labels on canvas)
                this.engine.mouseX = hit.cx;
                this.engine.mouseY = hit.cy;

                // Identify which hotspot is under the cursor
                const room = this.engine.rooms[this.engine.currentRoomId];
                if (room) {
                    this.pointedHotspot = this.engine.findHotspot(hit.cx, hit.cy, room);
                }
            }

            // ---- Gamepad buttons ----
            const gp = src.gamepad;
            if (!gp) continue;

            // Trigger (button 0) = click / interact
            const trig = gp.buttons[0] && gp.buttons[0].pressed;
            if (trig && !this.lastTrigger[i]) {
                this.onTriggerDown(hit);
            }
            this.lastTrigger[i] = trig;

            // Squeeze / Grip (button 1) = cycle through actions
            const squeeze = gp.buttons[1] && gp.buttons[1].pressed;
            if (squeeze && !this.lastSqueeze[i]) {
                this.cycleAction();
            }
            this.lastSqueeze[i] = squeeze;

            // A button (button 4) = skip cutscene / start game / restart
            const aBtn = gp.buttons.length > 4 && gp.buttons[4]
                && gp.buttons[4].pressed;
            if (aBtn && !this.lastAButton[i]) {
                if (this.engine.cutscene) {
                    this.engine.skipCutscene();
                    this.engine.playerVisible = false;
                } else if (this.engine.titleScreen) {
                    this.engine.titleScreen = false;
                    this.engine.sound.gameStart();
                    this.engine.goToRoom('broom_closet', 320, 310);
                    this.engine.playerVisible = false;
                } else if (this.engine.dead || this.engine.won) {
                    this.engine.restart();
                    this.engine.playerVisible = false;
                }
            }
            this.lastAButton[i] = !!aBtn;
        }
    }

    onTriggerDown(hit) {
        this.engine.sound.init();

        // Title screen: start game
        if (this.engine.titleScreen) {
            this.engine.titleScreen = false;
            this.engine.sound.gameStart();
            this.engine.goToRoom('broom_closet', 320, 310);
            this.engine.playerVisible = false;
            return;
        }

        // Death/win: restart
        if (this.engine.dead || this.engine.won) {
            this.engine.restart();
            this.engine.playerVisible = false;
            return;
        }

        // Cutscene: skip
        if (this.engine.cutscene) {
            this.engine.skipCutscene();
            this.engine.playerVisible = false;
            return;
        }

        if (!hit) return;

        // VR optimization: instant room transitions for Walk + Exit
        // (skip the walking animation since we're first-person)
        if (this.engine.currentAction === 'walk'
            && this.pointedHotspot
            && this.pointedHotspot.isExit) {
            const hs = this.pointedHotspot;
            if (hs.walkToX !== undefined) this.engine.playerX = hs.walkToX;
            if (hs.walkToY !== undefined) this.engine.playerY = hs.walkToY;
            if (hs.onExit) hs.onExit(this.engine);
            this.engine.playerVisible = false;
            return;
        }

        // Standard click handling (mapped from 3D raycast to 2D canvas coords)
        this.engine.handleClick(hit.cx, hit.cy);

        // Keep sprite hidden after actions (engine might re-enable it)
        if (!this.engine.cutscene) {
            this.engine.playerVisible = false;
        }
    }

    cycleAction() {
        this.actionIndex = (this.actionIndex + 1) % this.actions.length;
        this.engine.setAction(this.actions[this.actionIndex]);
    }

    // ===============================
    // Raycasting Math
    // ===============================

    getRayDirection(transform) {
        // Rotate (0, 0, -1) by the target ray's orientation quaternion
        const q = transform.orientation;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        const dx = 2 * (qx * qz + qw * qy);
        const dy = 2 * (qy * qz - qw * qx);
        const dz = 1 - 2 * (qx * qx + qy * qy);
        return [-dx, -dy, -dz];
    }

    rayCylinderIntersect(origin, dir) {
        // Intersect ray with cylinder x^2 + z^2 = R^2
        // Player stands inside the cylinder, ray hits the inner surface
        const R = this.backdropRadius;

        // Quadratic equation coefficients (projected onto XZ plane)
        const a = dir[0] * dir[0] + dir[2] * dir[2];
        if (a < 1e-8) return null; // Ray is vertical (parallel to cylinder axis)

        const b = 2 * (origin[0] * dir[0] + origin[2] * dir[2]);
        const c = origin[0] * origin[0] + origin[2] * origin[2] - R * R;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return null;

        const sqrtDisc = Math.sqrt(disc);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);

        // Inside the cylinder: one t is negative, one positive
        // Take the nearest positive intersection
        let t = t2;
        if (t1 > 0.01 && t1 < t) t = t1;
        if (t <= 0.01) t = t2;
        if (t <= 0.01) return null;

        const hitX = origin[0] + t * dir[0];
        const hitY = origin[1] + t * dir[1];
        const hitZ = origin[2] + t * dir[2];

        // Check height bounds
        if (hitY < this.backdropBottom || hitY > this.backdropTop) return null;

        // Check angle bounds (only the wrap-around arc, not behind the player)
        const angle = Math.atan2(hitX, -hitZ);
        const halfArc = (this.backdropArcDeg / 2) * Math.PI / 180;
        if (angle < -halfArc || angle > halfArc) return null;

        // Convert to 2D canvas coordinates
        const u = (angle + halfArc) / (2 * halfArc);           // 0-1 along arc
        const v = (hitY - this.backdropTop)
            / (this.backdropBottom - this.backdropTop);          // 0-1 top to bottom
        const cx = Math.round(Math.max(0, Math.min(640, u * 640)));
        const cy = Math.round(Math.max(0, Math.min(400, v * 400)));

        return { t, cx, cy };
    }
}

// ============================================================
// Minimal Matrix Utilities (no dependencies)
// ============================================================

function mat4Identity(out) {
    out.fill(0);
    out[0] = out[5] = out[10] = out[15] = 1;
}

function mat4Translate(out, x, y, z) {
    out[12] += out[0] * x + out[4] * y + out[8] * z;
    out[13] += out[1] * x + out[5] * y + out[9] * z;
    out[14] += out[2] * x + out[6] * y + out[10] * z;
    out[15] += out[3] * x + out[7] * y + out[11] * z;
}
