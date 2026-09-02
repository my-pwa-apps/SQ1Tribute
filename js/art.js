// ============================================================
// STAR SWEEPER - SHARED ART
// ------------------------------------------------------------
// Procedural drawing helpers shared by every room and cutscene.
// Declared at script scope so room modules can call them directly,
// matching how GameEngine and SoundEngine are already exposed.
// ============================================================

/* eslint-disable no-unused-vars -- helpers are consumed by room modules in other files */

// ========== DRAWING HELPERS ==========
const ditherPatternCache = new Map();
const perspectiveSurfaceCanvas = document.createElement('canvas');

/** Paint a small logical surface, then map it into a wall trapezoid one
 * pixel column at a time. Canvas affine transforms can only shear text;
 * this also compresses glyphs toward the vanishing edge. */
function drawPerspectiveSurface(ctx, sourceWidth, sourceHeight, quad, paint) {
    perspectiveSurfaceCanvas.width = sourceWidth;
    perspectiveSurfaceCanvas.height = sourceHeight;
    const source = perspectiveSurfaceCanvas.getContext('2d');
    source.imageSmoothingEnabled = false;
    source.clearRect(0, 0, sourceWidth, sourceHeight);
    paint(source);

    const leftHeight = quad.bl.y - quad.tl.y;
    const rightHeight = quad.br.y - quad.tr.y;
    const compression = Math.max(-0.4, Math.min(0.4,
        (leftHeight - rightHeight) / Math.max(leftHeight, rightHeight)));
    const mapU = (u) => u + compression * u * (1 - u);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let sx = 0; sx < sourceWidth; sx++) {
        const u0 = mapU(sx / sourceWidth);
        const u1 = mapU((sx + 1) / sourceWidth);
        const x0 = quad.tl.x + (quad.tr.x - quad.tl.x) * u0;
        const x1 = quad.tl.x + (quad.tr.x - quad.tl.x) * u1;
        const topY = quad.tl.y + (quad.tr.y - quad.tl.y) * u0;
        const bottomY = quad.bl.y + (quad.br.y - quad.bl.y) * u0;
        ctx.drawImage(perspectiveSurfaceCanvas, sx, 0, 1, sourceHeight,
            x0, topY, Math.max(1, x1 - x0 + 0.35), bottomY - topY);
    }
    ctx.restore();
}

function getDitherPattern(ctx, c1, c2, ps) {
    const key = `${c1}|${c2}|${ps}`;
    const cached = ditherPatternCache.get(key);
    if (cached) return cached;

    const tile = document.createElement('canvas');
    tile.width = ps * 2;
    tile.height = ps * 2;
    const tctx = tile.getContext('2d');
    tctx.fillStyle = c1;
    tctx.fillRect(0, 0, tile.width, tile.height);
    tctx.fillStyle = c2;
    tctx.fillRect(0, 0, ps, ps);
    tctx.fillRect(ps, ps, ps, ps);
    const pattern = ctx.createPattern(tile, 'repeat');
    ditherPatternCache.set(key, pattern);
    return pattern;
}

/** Draw a dithered rectangle (checkerboard pattern of two colors — classic EGA look) */
function ditherRect(ctx, x, y, w, h, c1, c2, patternSize) {
    const ps = patternSize || 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = getDitherPattern(ctx, c1, c2, ps);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}

function stars(ctx, w, h, seed, count, yFraction) {
    let r = seed || 54321;
    const maxY = h * (yFraction || 1);
    const next = () => { r = (r * 16807) % 2147483647; return (r & 0xFFFF) / 0xFFFF; };
    for (let i = 0; i < (count || 90); i++) {
        const x = next() * w, y = next() * maxY;
        const b = 130 + Math.floor(next() * 125);
        ctx.fillStyle = `rgb(${b},${b},${b + 15})`;
        ctx.fillRect(x, y, next() > 0.85 ? 2 : 1, 1);
    }
}

function metalWall(ctx, x, y, w, h, base, panel) {
    base = base || PAL.HULL_BASE;
    panel = panel || PAL.HULL_PANEL;
    ditherRect(ctx, x, y, w, h, base, panel, 2);
    ctx.strokeStyle = PAL.OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 1;
    const pw = 55;
    for (let px = x + 4; px < x + w - 4; px += pw + 4) {
        const rw = Math.min(pw, x + w - px - 4);
        ctx.fillStyle = PAL.OUTLINE;
        ctx.fillRect(px - 1, y + 3, rw + 2, h - 6);
        ctx.fillStyle = panel;
        ctx.fillRect(px, y + 4, rw, h - 8);
        ctx.strokeStyle = PAL.OUTLINE;
        ctx.strokeRect(px, y + 4, rw, h - 8);
        ctx.fillStyle = PAL.EDGE_HIGHLIGHT;
        ctx.fillRect(px, y + 4, rw, 1);
        ctx.fillRect(px, y + 4, 1, h - 8);
        ctx.fillStyle = PAL.EDGE_SHADOW;
        ctx.fillRect(px + rw - 1, y + 5, 1, h - 9);
        ctx.fillRect(px + 1, y + h - 5, rw - 2, 1);
    }
}

function perspectiveFloor(ctx, topY, w, h, base) {
    ctx.fillStyle = base;
    ctx.fillRect(0, topY, w, h - topY);
}
function sceneFont(size, weight) {
    const responsiveSize = window.innerWidth <= 480 ? Math.max(size, 12) : size;
    return `${weight ? weight + ' ' : ''}${responsiveSize}px "Courier New"`;
}

function alarmGlow(ctx, w, h, eng) {
    const pulse = Math.floor(eng.animTimer / 500) % 2;
    if (!pulse) return;
    // Red alert wash concentrated near the ceiling fixtures, fading out
    // before the floor. A flat full-canvas tint washed every prop colour
    // to the same plum-grey; Sierra alarm lighting stayed a local glow.
    const g = ctx.createLinearGradient(0, 17, 0, h);
    g.addColorStop(0, 'rgba(255,40,30,0.16)');
    g.addColorStop(0.45, 'rgba(255,40,30,0.05)');
    g.addColorStop(1, 'rgba(255,40,30,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 17, w, h - 17);
}

function alarmLight(ctx, x, y, eng) {
    const on = Math.floor(eng.animTimer / 500) % 2;
    ctx.fillStyle = on ? '#FF5555' : '#AA0000';
    ctx.fillRect(x, y, 22, 10);
    ctx.fillRect(x + 2, y - 3, 18, 3);
    if (on) {
        ctx.save();
        // Clip glow to stay below y=17 (top action bar) and within canvas
        ctx.beginPath();
        ctx.rect(0, 17, (eng.WIDTH || 640), (eng.HEIGHT || 400) - 17);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,50,50,0.15)';
        ctx.beginPath();
        ctx.arc(x + 11, y + 5, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function gradientRect(ctx, x, y, w, h, c1, c2, vertical) {
    // EGA style dithered gradient
    const steps = 4;
    const stepSize = (vertical !== false ? h : w) / steps;
    
    for (let i = 0; i < steps; i++) {
        const pos = i * stepSize;
        const size = stepSize;
        
        let rx = x, ry = y, rw = w, rh = h;
        if (vertical !== false) {
            ry = y + pos;
            rh = size;
        } else {
            rx = x + pos;
            rw = size;
        }
        
        if (i === 0) {
            ctx.fillStyle = c1;
            ctx.fillRect(rx, ry, rw, rh);
        } else if (i === steps - 1) {
            ctx.fillStyle = c2;
            ctx.fillRect(rx, ry, rw, rh);
        } else {
            // Dither mix
            const mix = i / (steps - 1);
            const ps = 2;
            ctx.fillStyle = mix < 0.5 ? c1 : c2;
            ctx.fillRect(rx, ry, rw, rh);
            
            ctx.fillStyle = mix < 0.5 ? c2 : c1;
            const density = mix < 0.5 ? mix * 2 : (1 - mix) * 2;
            
            for (let py = ry; py < ry + rh; py += ps) {
                const offset = ((py - ry) / ps) % 2 === 0 ? 0 : ps;
                for (let px = rx + offset; px < rx + rw; px += ps * 2) {
                    // Deterministic dither based on position to avoid per-frame flicker
                    const hash = ((px * 73 + py * 137) & 0xFF) / 255;
                    if (hash < density) {
                        ctx.fillRect(px, py, ps, ps);
                    }
                }
            }
        }
    }
}

// ========== CUTSCENE DRAWING FUNCTIONS ==========

// One hull palette for every craft in the game, so a pod seen in the bay,
// the launch cinematic and the desert wreck reads as the same machine.
const CRAFT = {
    edge: '#050509',
    hi: '#b9bac6',
    mid: '#667788',
    lo: '#3a4454',
    glassLo: '#116688',
    glass: '#33ccee',
    spec: '#ffffff',
    accent: '#ff8833',
    dead: '#2a2f38'
};

function drawShipSilhouette(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = CRAFT.edge;
    ctx.beginPath();
    ctx.moveTo(-64, 0); ctx.lineTo(-43, -15); ctx.lineTo(52, -13);
    ctx.lineTo(69, -6); ctx.lineTo(69, 6); ctx.lineTo(52, 13);
    ctx.lineTo(-43, 15); ctx.lineTo(-64, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.mid;
    // Main hull
    ctx.beginPath();
    ctx.moveTo(-60, 0); ctx.lineTo(-40, -12); ctx.lineTo(50, -10);
    ctx.lineTo(65, -4); ctx.lineTo(65, 4); ctx.lineTo(50, 10);
    ctx.lineTo(-40, 12); ctx.lineTo(-60, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.hi;
    ctx.beginPath();
    ctx.moveTo(-40, -12); ctx.lineTo(50, -10); ctx.lineTo(63, -3); ctx.lineTo(-48, -4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.accent;
    ctx.fillRect(-16, -11, 4, 22);
    // Bridge
    ctx.fillStyle = CRAFT.lo;
    ctx.fillRect(30, -6, 18, 12);
    ctx.fillStyle = CRAFT.glass;
    ctx.fillRect(33, -4, 12, 3);
    // Engine glow
    ctx.fillStyle = '#4af';
    ctx.fillRect(-62, -3, 4, 6);
    ctx.restore();
}

// Canonical escape pod. The bay, the launch cinematic and the desert wreck
// all render this one craft so the silhouette never changes between scenes.
function drawEscapePod(ctx, x, y, scale, angle, damaged) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale, scale);
    // Heavy black silhouette and stepped capsule geometry keep the pod
    // readable at the tiny scales used by Sierra-style cinematics.
    ctx.fillStyle = CRAFT.edge;
    ctx.beginPath();
    ctx.moveTo(-15, -4); ctx.lineTo(-10, -10); ctx.lineTo(7, -10);
    ctx.lineTo(14, -5); ctx.lineTo(16, 0); ctx.lineTo(13, 6);
    ctx.lineTo(6, 10); ctx.lineTo(-10, 9); ctx.lineTo(-15, 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.hi;
    ctx.beginPath();
    ctx.moveTo(-11, -3); ctx.lineTo(-7, -7); ctx.lineTo(6, -7);
    ctx.lineTo(12, -3); ctx.lineTo(13, 2); ctx.lineTo(8, 7);
    ctx.lineTo(-7, 6); ctx.lineTo(-11, 3); ctx.closePath(); ctx.fill();
    // Shadowed belly, heat shield and emergency-orange identification band.
    ctx.fillStyle = CRAFT.mid;
    ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(12, 1); ctx.lineTo(8, 7); ctx.lineTo(-7, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.lo; ctx.fillRect(-14, -4, 4, 8);
    ctx.fillStyle = CRAFT.accent; ctx.fillRect(-8, -7, 3, 13);
    // Side hatch: the same door in the bay, the cinematic and the wreck.
    ctx.fillStyle = CRAFT.edge; ctx.fillRect(-4, -5, 7, 11);
    ctx.fillStyle = damaged ? CRAFT.dead : CRAFT.mid; ctx.fillRect(-3, -4, 5, 9);
    ctx.fillStyle = CRAFT.hi; ctx.fillRect(-3, -4, 5, 1);
    ctx.fillStyle = '#ccaa22'; ctx.fillRect(1, -1, 2, 3);
    // Cockpit: dark inset, saturated glass and one hard specular pixel.
    ctx.fillStyle = CRAFT.edge;
    ctx.beginPath(); ctx.moveTo(3, -7); ctx.lineTo(9, -6); ctx.lineTo(12, -2); ctx.lineTo(9, 2); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = damaged ? CRAFT.glassLo : CRAFT.glass;
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(8, -5); ctx.lineTo(10, -2); ctx.lineTo(8, 0); ctx.lineTo(4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = damaged ? CRAFT.edge : CRAFT.spec; ctx.fillRect(5, -5, 3, 1);
    // Thruster cluster.
    ctx.fillStyle = CRAFT.lo; ctx.fillRect(-13, -6, 3, 3); ctx.fillRect(-13, 3, 3, 3);
    if (damaged) {
        ctx.fillStyle = 'rgba(16,10,8,0.4)';
        ctx.fillRect(-12, -9, 4, 18); ctx.fillRect(5, 4, 6, 4);
        ctx.fillStyle = CRAFT.edge;
        ctx.fillRect(5, -8, 4, 3); ctx.fillRect(-1, 7, 5, 3);
        ctx.strokeStyle = CRAFT.spec; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(4, -4); ctx.lineTo(9, -1); ctx.moveTo(7, -5); ctx.lineTo(6, 0);
        ctx.stroke();
    } else {
        // Landing skids only deploy on an intact pod.
        ctx.fillStyle = CRAFT.edge;
        ctx.fillRect(-5, 7, 2, 4); ctx.fillRect(7, 6, 2, 4);
        ctx.fillRect(-8, 10, 6, 2); ctx.fillRect(6, 9, 6, 2);
    }
    ctx.restore();
}

function drawShuttleCraft(ctx, x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale, scale);
    // Black underdrawing binds fuselage and wings into one memorable shape.
    ctx.fillStyle = CRAFT.edge;
    ctx.beginPath();
    ctx.moveTo(-25, 0); ctx.lineTo(-15, -11); ctx.lineTo(-5, -11);
    ctx.lineTo(3, -21); ctx.lineTo(17, -21); ctx.lineTo(14, -10);
    ctx.lineTo(22, -8); ctx.lineTo(29, -2); ctx.lineTo(29, 3);
    ctx.lineTo(22, 9); ctx.lineTo(14, 10); ctx.lineTo(17, 21);
    ctx.lineTo(3, 21); ctx.lineTo(-5, 11); ctx.lineTo(-15, 11);
    ctx.closePath(); ctx.fill();
    // Fuselage
    ctx.fillStyle = CRAFT.hi;
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-12, -8); ctx.lineTo(20, -6);
    ctx.lineTo(25, 0); ctx.lineTo(20, 6); ctx.lineTo(-12, 8);
    ctx.closePath(); ctx.fill();
    // Wings
    ctx.fillStyle = CRAFT.lo;
    ctx.beginPath();
    ctx.moveTo(-5, -8); ctx.lineTo(5, -18); ctx.lineTo(15, -18); ctx.lineTo(10, -6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, 8); ctx.lineTo(5, 18); ctx.lineTo(15, 18); ctx.lineTo(10, 6);
    ctx.closePath(); ctx.fill();
    // Belly panels and high-contrast cockpit glass.
    ctx.fillStyle = CRAFT.mid;
    ctx.beginPath(); ctx.moveTo(-17, 2); ctx.lineTo(21, 1); ctx.lineTo(18, 6); ctx.lineTo(-11, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.edge;
    ctx.beginPath(); ctx.moveTo(11, -5); ctx.lineTo(21, -4); ctx.lineTo(25, 0); ctx.lineTo(20, 4); ctx.lineTo(11, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.glass;
    ctx.beginPath(); ctx.moveTo(13, -3); ctx.lineTo(20, -2); ctx.lineTo(22, 0); ctx.lineTo(19, 2); ctx.lineTo(13, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRAFT.spec; ctx.fillRect(14, -2, 4, 1);
    // Emergency stripe, panel seam and twin engine apertures.
    ctx.fillStyle = CRAFT.accent; ctx.fillRect(-6, -7, 3, 14);
    ctx.strokeStyle = CRAFT.lo; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.fillStyle = CRAFT.lo; ctx.fillRect(-23, -6, 5, 4); ctx.fillRect(-23, 2, 5, 4);
    ctx.fillStyle = CRAFT.accent; ctx.fillRect(-24, -5, 3, 2); ctx.fillRect(-24, 3, 3, 2);
    ctx.restore();
}

// Port-side hull breach in freighter-local coordinates, shared so the
// docking bay can light the same opening from the inside.
const FREIGHTER_BREACH = [[-56, -18], [-44, -24], [-30, -14], [-26, 2], [-38, 8], [-52, 2]];

// Kepler-class cargo hauler: blunt bow, exposed container spine, twin bells.
// The Ironclad Star flies in the distress cinematic and lies broken-backed at
// the docking bay, so both must read as the same vessel.
function drawFreighter(ctx, x, y, scale, wrecked) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const poly = (color, pts) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.fill();
    };
    // A wrecked hauler breaks its back: the bow digs in nose-first while the
    // engine block rides up behind the snapped spine.
    const dNose = wrecked ? 16 : 0;
    const dRear = wrecked ? 4 : 0;
    const dMid = wrecked ? 13 : 0;
    const dAft = wrecked ? -8 : 0;
    const bow = (px, py) => [px, py + dNose + (dRear - dNose) * ((px + 96) / 72)];

    // Engine block and twin bells, aft. Kept darker than the bow so the
    // bridge stays the focal point of the wreck.
    poly(CRAFT.edge, [[42, -34 + dAft], [92, -24 + dAft], [98, 22 + dAft], [42, 28 + dAft]]);
    poly(CRAFT.lo, [[46, -30 + dAft], [88, -21 + dAft], [93, 18 + dAft], [46, 24 + dAft]]);
    poly(CRAFT.mid, [[46, -30 + dAft], [88, -21 + dAft], [88, -10 + dAft], [46, -16 + dAft]]);
    poly('#242c38', [[46, 6 + dAft], [90, 3 + dAft], [93, 18 + dAft], [46, 24 + dAft]]);
    ctx.fillStyle = CRAFT.accent;
    ctx.fillRect(52, -14 + dAft, 30, 4);
    for (const by of [-16, 12]) {
        poly(CRAFT.edge, [[90, by - 9 + dAft], [104, by - 14 + dAft], [104, by + 14 + dAft], [90, by + 9 + dAft]]);
        poly(wrecked ? '#241a16' : CRAFT.lo, [[93, by - 7 + dAft], [101, by - 11 + dAft], [101, by + 11 + dAft], [93, by + 7 + dAft]]);
        // Nozzle throat rings read as an engine bell rather than a hole.
        ctx.strokeStyle = wrecked ? '#4a3b30' : CRAFT.mid; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(96, by - 9 + dAft); ctx.lineTo(96, by + 9 + dAft);
        ctx.moveTo(99, by - 10 + dAft); ctx.lineTo(99, by + 10 + dAft);
        ctx.stroke();
        if (!wrecked) {
            ctx.fillStyle = '#66ddff'; ctx.fillRect(101, by - 9, 5, 18);
            ctx.fillStyle = CRAFT.spec; ctx.fillRect(101, by - 4, 3, 8);
        }
    }

    // Open girder spine carrying the cargo racks.
    const seg = (x1, o1, x2, o2) => {
        poly(CRAFT.edge, [[x1, o1 - 14], [x2, o2 - 14], [x2, o2 + 14], [x1, o1 + 14]]);
        poly(CRAFT.lo, [[x1, o1 - 11], [x2, o2 - 11], [x2, o2 + 11], [x1, o1 + 11]]);
        poly(CRAFT.mid, [[x1, o1 - 11], [x2, o2 - 11], [x2, o2 - 4], [x1, o1 - 4]]);
    };
    if (wrecked) { seg(-26, dRear, 10, dMid); seg(15, dMid, 48, dAft); }
    else { seg(-26, 0, 48, 0); }
    ctx.strokeStyle = CRAFT.edge; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const sx = -26 + (i / 7) * 74;
        const so = sx < 12 ? dRear + (dMid - dRear) * ((sx + 26) / 38) : dMid + (dAft - dMid) * ((sx - 12) / 36);
        ctx.beginPath(); ctx.moveTo(sx, so - 11); ctx.lineTo(sx, so + 11); ctx.stroke();
    }
    ctx.lineWidth = 1;

    const container = (cx, co, tilt, body) => {
        ctx.save(); ctx.translate(cx, co); ctx.rotate(tilt);
        poly(CRAFT.edge, [[-17, -32], [17, -32], [17, -2], [-17, -2]]);
        ctx.fillStyle = body; ctx.fillRect(-15, -30, 30, 26);
        ctx.fillStyle = CRAFT.edge;
        for (let rx = -11; rx < 15; rx += 6) ctx.fillRect(rx, -30, 2, 26);
        ctx.fillStyle = CRAFT.accent; ctx.fillRect(-15, -22, 30, 4);
        ctx.restore();
    };
    if (wrecked) {
        // Empty clamps where a container tore free, one still riding aft.
        ctx.fillStyle = CRAFT.lo;
        ctx.fillRect(-22, dRear - 18, 5, 13); ctx.fillRect(2, dMid - 18, 5, 13);
        container(32, dAft + 2, -0.14, '#3c5a68');
        ctx.strokeStyle = CRAFT.hi; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(10, dMid - 11); ctx.lineTo(17, dMid - 19); ctx.lineTo(23, dMid - 10);
        ctx.moveTo(9, dMid + 11); ctx.lineTo(16, dMid + 18);
        ctx.stroke(); ctx.lineWidth = 1;
        // A container shaken loose by the break, spilled under the spine.
        container(18, 48, 0.16, '#7a6a4a');
    } else {
        container(-8, 0, 0, '#7a6a4a');
        container(28, 0, 0, '#4a6a7a');
    }

    // Bow hull, bridge and cockpit.
    poly(CRAFT.edge, [bow(-104, -8), bow(-94, -34), bow(-24, -30), bow(-18, 20), bow(-98, 24)]);
    poly(CRAFT.mid, [bow(-100, -8), bow(-91, -30), bow(-26, -26), bow(-21, 16), bow(-95, 20)]);
    poly(CRAFT.hi, [bow(-100, -8), bow(-91, -30), bow(-26, -26), bow(-28, -12), bow(-99, -13)]);
    poly(CRAFT.lo, [bow(-97, 8), bow(-24, 4), bow(-21, 16), bow(-95, 20)]);
    poly(CRAFT.accent, [bow(-99, -12), bow(-28, -11), bow(-28, -6), bow(-99, -7)]);
    ctx.strokeStyle = CRAFT.lo;
    ctx.beginPath();
    ctx.moveTo(bow(-84, -29)[0], bow(-84, -29)[1]); ctx.lineTo(bow(-83, 19)[0], bow(-83, 19)[1]);
    ctx.moveTo(bow(-62, -28)[0], bow(-62, -28)[1]); ctx.lineTo(bow(-61, 18)[0], bow(-61, 18)[1]);
    ctx.stroke();
    poly(CRAFT.edge, [bow(-90, -32), bow(-84, -48), bow(-58, -48), bow(-54, -32)]);
    poly(CRAFT.mid, [bow(-87, -32), bow(-82, -45), bow(-60, -45), bow(-57, -32)]);
    poly(CRAFT.hi, [bow(-87, -34), bow(-82, -45), bow(-60, -45), bow(-58, -34)]);
    poly(CRAFT.glassLo, [bow(-83, -43), bow(-62, -43), bow(-61, -36), bow(-84, -36)]);
    poly(wrecked ? '#16323d' : CRAFT.glass, [bow(-82, -42), bow(-63, -42), bow(-62, -37), bow(-83, -37)]);
    if (!wrecked) poly(CRAFT.spec, [bow(-81, -41), bow(-72, -41), bow(-72, -40), bow(-81, -40)]);

    if (wrecked) {
        poly('rgba(14,9,14,0.6)', [bow(-74, -30), bow(-67, -30), bow(-70, 20), bow(-77, 20)]);
        ctx.fillStyle = 'rgba(14,9,14,0.6)';
        ctx.fillRect(50, -20 + dAft, 6, 28);
        poly(CRAFT.edge, [[56, 14], [70, 14], [77, 42], [63, 42]]);
        poly(CRAFT.mid, [[59, 16], [68, 16], [74, 40], [65, 40]]);
        poly('#0a0a14', FREIGHTER_BREACH);
        // Cargo deck seen through the tear, so the hole reads as a way in.
        poly('#1d2733', [[-52, -13], [-32, -10], [-30, 1], [-48, 3]]);
        poly('#35424f', [[-52, -13], [-32, -10], [-32, -7], [-52, -10]]);
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(-47, -6, 7, 7);
        ctx.fillStyle = '#6a5a3a';
        ctx.fillRect(-38, -6, 6, 6);
        // Peeled plating around the rim
        ctx.strokeStyle = CRAFT.hi; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-56, -18); ctx.lineTo(-63, -25);
        ctx.moveTo(-30, -14); ctx.lineTo(-23, -21);
        ctx.moveTo(-38, 8); ctx.lineTo(-36, 15);
        ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = CRAFT.hi;
        ctx.beginPath();
        ctx.moveTo(-44, -24); ctx.lineTo(-40, -19); ctx.lineTo(-36, -24); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-52, 2); ctx.lineTo(-48, -2); ctx.lineTo(-46, 4); ctx.closePath(); ctx.fill();
    }

    if (scale >= 1.5) {
        const plate = bow(-94, 6);
        ctx.fillStyle = wrecked ? '#8fa2b3' : '#cfe0ee';
        ctx.font = '5px "Courier New"';
        ctx.fillText('IRONCLAD STAR', plate[0], plate[1]);
        ctx.fillStyle = wrecked ? '#5f7280' : '#9fb2c0';
        ctx.font = '4px "Courier New"';
        ctx.fillText('REG: ISS-4471', plate[0], plate[1] + 7);
    }
    ctx.restore();
}

function drawDraknoidShip(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    // Black outline and angular underside give the flagship a heavy,
    // predatory silhouette even when it is only a few dozen pixels wide.
    ctx.fillStyle = '#080d09';
    ctx.beginPath();
    ctx.moveTo(-84, 0); ctx.lineTo(-42, -29); ctx.lineTo(62, -24);
    ctx.lineTo(84, -10); ctx.lineTo(84, 10); ctx.lineTo(62, 24);
    ctx.lineTo(-42, 29); ctx.lineTo(-84, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#344332';
    ctx.beginPath();
    ctx.moveTo(-80, 0); ctx.lineTo(-40, -25); ctx.lineTo(60, -20);
    ctx.lineTo(80, -8); ctx.lineTo(80, 8); ctx.lineTo(60, 20);
    ctx.lineTo(-40, 25); ctx.closePath(); ctx.fill();
    // Lit dorsal armor and shadowed lower plating.
    ctx.fillStyle = '#455743';
    ctx.beginPath();
    ctx.moveTo(-40, -25); ctx.lineTo(60, -20); ctx.lineTo(78, -8);
    ctx.lineTo(-55, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#202d22';
    ctx.beginPath();
    ctx.moveTo(-78, 2); ctx.lineTo(78, 8); ctx.lineTo(60, 20);
    ctx.lineTo(-40, 25); ctx.closePath(); ctx.fill();
    // Command tower, antenna and armored prow.
    ctx.fillStyle = '#111a13';
    ctx.fillRect(8, -33, 44, 18);
    ctx.fillStyle = '#4c5d49';
    ctx.fillRect(12, -31, 36, 13);
    ctx.fillStyle = '#6d8067';
    ctx.fillRect(17, -31, 25, 2);
    ctx.fillStyle = '#263328';
    ctx.fillRect(62, -15, 13, 30);
    ctx.fillRect(24, -38, 2, 7);
    // Armor seams track the rake of the hull.
    ctx.strokeStyle = '#101a12';
    ctx.lineWidth = 1;
    for (let i = -30; i < 70; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i + 10, 18); ctx.stroke();
    }
    // A narrow blood-red bridge and stacked engine apertures.
    ctx.fillStyle = '#551515';
    ctx.fillRect(48, -6, 12, 12);
    ctx.fillStyle = '#ff3434';
    ctx.fillRect(51, -4, 7, 7);
    ctx.fillStyle = 'rgba(85,255,102,0.2)';
    ctx.fillRect(-89, -11, 8, 22);
    ctx.fillStyle = '#55ff66';
    ctx.fillRect(-85, -9, 5, 7);
    ctx.fillRect(-85, 2, 5, 7);
    ctx.fillStyle = '#d7ff99';
    ctx.fillRect(-85, -7, 2, 3);
    ctx.fillRect(-85, 4, 2, 3);
    ctx.restore();
}

function drawDesertPlanet(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    // Base orange
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#d4a040');
    g.addColorStop(0.7, '#b07028');
    g.addColorStop(1, '#884818');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // Craters
    let rng = 7654;
    const nx = () => { rng = (rng * 16807) % 2147483647; return (rng & 0xFFFF) / 0xFFFF; };
    for (let i = 0; i < 8; i++) {
        const cx = x - r + nx() * r * 2, cy = y - r + nx() * r * 2;
        const cr = 3 + nx() * r * 0.15;
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

// CUTSCENE 1: Escape Pod Launch & Crash Landing
function cutscenePodLaunch(ctx, w, h, progress, elapsed) {
    // Background: space
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, 12345, 200);

    if (progress < 0.2) {
        // Phase 1: Ship in space, pod ejects
        const p = progress / 0.2;
        drawShipSilhouette(ctx, w * 0.5, h * 0.4, 3);
        // Pod emerging
        const podX = w * 0.5 + p * 80;
        const podY = h * 0.4 + p * 40;
        drawEscapePod(ctx, podX, podY, 2, p * 0.3);
        // Engine trail
        if (p > 0.3) {
            ctx.fillStyle = `rgba(100,180,255,${0.4 * (p - 0.3) / 0.7})`;
            ctx.fillRect(podX - 28, podY - 2, -(p - 0.3) * 30, 4);
        }
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('ISS Constellation — Pod Bay', w / 2, h - 30);
        ctx.textAlign = 'left';
    } else if (progress < 0.55) {
        // Phase 2: Pod traveling through space toward planet
        const p = (progress - 0.2) / 0.35;
        // Ship shrinks into distance
        const shipScale = 3 * (1 - p * 0.8);
        drawShipSilhouette(ctx, w * 0.5 - p * 200, h * 0.4 - p * 100, shipScale);
        // Planet growing
        const planetR = 10 + p * 90;
        drawDesertPlanet(ctx, w * 0.7 + (1 - p) * 100, h * 0.5, planetR);
        // Pod
        const podX = w * 0.3 + p * 200;
        const podY = h * 0.4 + p * 30;
        drawEscapePod(ctx, podX, podY, 2, 0.5);
        // Engine trail
        ctx.strokeStyle = `rgba(100,180,255,0.5)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(podX - 26, podY);
        ctx.lineTo(podX - 26 - 40 - p * 30, podY + 5);
        ctx.stroke();
        // Scrolling star streaks for sense of speed
        for (let i = 0; i < 5; i++) {
            const sy = 50 + i * 70;
            const sx = ((elapsed * 0.3 + i * 200) % (w + 60)) - 30;
            ctx.strokeStyle = 'rgba(200,200,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 20, sy); ctx.stroke();
        }
    } else if (progress < 0.8) {
        // Phase 3: Atmospheric entry with fire
        const p = (progress - 0.55) / 0.25;
        // Sky gradient: space to orange atmosphere
        const skyG = ctx.createLinearGradient(0, 0, 0, h);
        skyG.addColorStop(0, `rgba(0,0,0,${1 - p * 0.7})`);
        skyG.addColorStop(0.5, `rgba(${Math.floor(180 * p)},${Math.floor(80 * p)},${Math.floor(20 * p)},${p * 0.6})`);
        skyG.addColorStop(1, `rgba(${Math.floor(200 * p)},${Math.floor(120 * p)},${Math.floor(40 * p)},${p * 0.8})`);
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, w, h);
        stars(ctx, w, h, 12345, Math.floor(200 * (1 - p)));
        // Pod descending
        const podX = w * 0.5;
        const podY = h * 0.2 + p * h * 0.4;
        drawEscapePod(ctx, podX, podY, 2.5, 0.8 + p * 0.3);
        // Fire/plasma trail
        for (let i = 0; i < 8; i++) {
            const fx = podX - 15 - i * 8 + Math.sin(elapsed * 0.01 + i) * 3;
            const fy = podY - 20 - i * 12 + Math.cos(elapsed * 0.012 + i) * 2;
            const fr = 4 + i * 2;
            ctx.fillStyle = i < 3 ? `rgba(255,200,50,${0.7 - i * 0.1})` : `rgba(255,80,20,${0.5 - i * 0.05})`;
            ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
        }
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Entering atmosphere...', w / 2, h - 30);
        ctx.textAlign = 'left';
    } else {
        // Phase 4: Crash landing on desert
        const p = (progress - 0.8) / 0.2;
        ctx.save();
        if (p > 0.65 && p < 0.9) {
            const shake = Math.sin(elapsed * 0.05) * 3 * (1 - (p - 0.65) / 0.25);
            ctx.translate(shake, shake * 0.5);
        }
        // Desert terrain
        gradientRect(ctx, 0, 0, w, h * 0.55, '#c08030', '#a06820');
        gradientRect(ctx, 0, h * 0.55, w, h * 0.45, '#d4a048', '#c09038');
        // Mountain silhouettes
        ctx.fillStyle = '#906020';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.55); ctx.lineTo(60, h * 0.3); ctx.lineTo(140, h * 0.55);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(400, h * 0.55); ctx.lineTo(500, h * 0.25); ctx.lineTo(600, h * 0.45); ctx.lineTo(640, h * 0.55);
        ctx.fill();
        // Pod crashing
        const podY = h * 0.3 + p * (h * 0.25);
        const podX = w * 0.5 + p * 40;
        const bounce = p > 0.7 ? Math.sin((p - 0.7) / 0.3 * Math.PI) * 15 : 0;
        drawEscapePod(ctx, podX, podY - bounce, 2.5, 1.1 + p * 0.5);
        // Impact effects
        if (p > 0.6) {
            const ip = (p - 0.6) / 0.4;
            // Dust clouds
            for (let i = 0; i < 6; i++) {
                const dx = podX - 30 + i * 15 + Math.sin(i * 2) * ip * 20;
                const dy = podY + 5 + ip * 5;
                const dr = ip * (8 + i * 3);
                ctx.fillStyle = `rgba(180,140,80,${0.6 - ip * 0.4})`;
                ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2); ctx.fill();
            }
        }
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        if (p > 0.5) {
            ctx.fillText('CRASH LANDING!', w / 2, 30);
        }
        ctx.textAlign = 'left';
        ctx.restore();
    }
}

// Speech bubble helper (Sierra-style blue box)
function drawSpeechBubble(ctx, x, y, text) {
    ctx.font = '9px "Courier New"';
    const tw = ctx.measureText(text).width + 14;
    // Blue bubble background
    ctx.fillStyle = '#0000AA';
    ctx.fillRect(x - tw / 2, y - 10, tw, 18);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - tw / 2, y - 10, tw, 18);
    // Pointer triangle
    ctx.fillStyle = '#0000AA';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 8);
    ctx.lineTo(x + 4, y + 8);
    ctx.lineTo(x - 12, y + 22);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 8);
    ctx.lineTo(x - 12, y + 22);
    ctx.lineTo(x + 4, y + 8);
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    // White text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 3);
    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
}

// CUTSCENE 3: Shuttle Flight to Draknoid Ship
function cutsceneShuttleFlight(ctx, w, h, progress, elapsed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, 77777, 200);

    if (progress < 0.25) {
        // Phase 1: Liftoff from outpost
        const p = progress / 0.25;
        // Ground
        gradientRect(ctx, 0, h * 0.7, w, h * 0.3, '#553820', '#3a2515');
        // Simple outpost buildings
        ctx.fillStyle = '#887060';
        ctx.fillRect(100, h * 0.7 - 40, 80, 40);
        ctx.fillRect(250, h * 0.7 - 55, 100, 55);
        ctx.fillRect(450, h * 0.7 - 35, 60, 35);
        // Landing pad
        ctx.fillStyle = '#555566';
        ctx.fillRect(294, h * 0.7 - 6, 92, 9);
        ctx.fillStyle = '#FFAA22';
        for (let x = 298; x < 382; x += 12) ctx.fillRect(x, h * 0.7 - 6, 6, 3);
        ctx.fillStyle = '#FFDD55';
        ctx.fillRect(292, h * 0.7 - 10, 3, 5);
        ctx.fillRect(385, h * 0.7 - 10, 3, 5);
        ctx.fillStyle = '#55FFFF';
        ctx.fillRect(268, h * 0.7 - 48, 14, 3);
        ctx.fillStyle = '#FFAA55';
        ctx.fillRect(118, h * 0.7 - 32, 10, 3);
        // Orange planet sky
        gradientRect(ctx, 0, h * 0.5, w, h * 0.2, 'rgba(180,100,30,0)', 'rgba(180,100,30,0.3)');
        // Shuttle lifting off
        const sy = h * 0.65 - p * h * 0.5;
        drawShuttleCraft(ctx, 340, sy, 2.5, -Math.PI / 2);
        // Thruster flame
        const flameH = 15 + Math.sin(elapsed * 0.02) * 5;
        ctx.fillStyle = '#f84';
        ctx.fillRect(337, sy + 15, 6, flameH);
        ctx.fillStyle = '#ff4';
        ctx.fillRect(338, sy + 15, 4, flameH * 0.6);
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Launching from outpost...', w / 2, h - 20);
        ctx.textAlign = 'left';
    } else if (progress < 0.7) {
        // Phase 2: Flying through space
        const p = (progress - 0.25) / 0.45;
        // Star streaks for speed
        for (let i = 0; i < 15; i++) {
            const sy = 20 + (i * 47 + Math.floor(elapsed * 0.1)) % (h - 20);
            const len = 10 + p * 30;
            ctx.strokeStyle = `rgba(180,200,255,${0.2 + p * 0.3})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(((i * 97 + elapsed * 0.4) % (w + len)) - len, sy);
            ctx.lineTo(((i * 97 + elapsed * 0.4) % (w + len)), sy);
            ctx.stroke();
        }
        // Shuttle in center, slight bob
        const bobY = Math.sin(elapsed * 0.003) * 5;
        drawShuttleCraft(ctx, w * 0.5, h * 0.5 + bobY, 3, 0);
        // Engine trail
        ctx.fillStyle = 'rgba(255,130,60,0.5)';
        ctx.fillRect(w * 0.5 - 70, h * 0.5 + bobY - 3, -30 - p * 40, 6);
        ctx.fillStyle = 'rgba(255,200,100,0.3)';
        ctx.fillRect(w * 0.5 - 100 - p * 40, h * 0.5 + bobY - 1, -20, 2);
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('En route to Draknoid Flagship...', w / 2, h - 20);
        ctx.textAlign = 'left';
    } else {
        // Phase 3: Approaching Draknoid flagship
        const p = (progress - 0.7) / 0.3;
        // Draknoid ship growing
        const shipScale = 0.5 + p * 2.5;
        drawDraknoidShip(ctx, w * 0.6 - p * 50, h * 0.45, shipScale);
        // Shuttle approaching
        const sx = w * 0.15 + p * 80;
        drawShuttleCraft(ctx, sx, h * 0.5, 2 - p * 0.5, 0);
        // Engine trail
        ctx.fillStyle = 'rgba(255,130,60,0.4)';
        ctx.fillRect(sx - 48, h * 0.5 - 2, -30, 4);
        // Warning lights on Draknoid ship
        if (p > 0.5) {
            const blink = Math.floor(elapsed / 300) % 2;
            if (blink) {
                ctx.fillStyle = 'rgba(255,0,0,0.3)';
                ctx.fillRect(0, 0, w, h);
            }
        }
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        if (p < 0.5) {
            ctx.fillText('Target acquired...', w / 2, h - 20);
        } else {
            ctx.fillText('Docking with Draknoid Flagship!', w / 2, h - 20);
        }
        ctx.textAlign = 'left';
    }
}

function drawPipzReunion(ctx, w, h) {
    gradientRect(ctx, 0, 0, w, 190, '#24162f', '#9c4e48');
    gradientRect(ctx, 0, 190, w, h - 190, '#574032', '#211a1a');
    // Deep hangar mouth and structural frame.
    ctx.fillStyle = '#171d2b';
    ctx.beginPath();
    ctx.moveTo(122, 74); ctx.lineTo(518, 74); ctx.lineTo(570, 286);
    ctx.lineTo(70, 286); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#675850';
    ctx.fillRect(70, 68, 500, 17);
    ctx.fillRect(70, 275, 500, 12);
    ctx.fillRect(70, 68, 14, 219);
    ctx.fillRect(556, 68, 14, 219);
    ctx.fillStyle = '#2b3343';
    ctx.fillRect(205, 116, 230, 159);
    // Receding ceiling ribs and floor seams reinforce the cinematic depth.
    ctx.strokeStyle = '#485268';
    ctx.lineWidth = 3;
    for (let x = 108; x <= 532; x += 53) {
        ctx.beginPath(); ctx.moveTo(x, 84); ctx.lineTo(320 + (x - 320) * 0.54, 116); ctx.stroke();
    }
    ctx.strokeStyle = '#745744';
    ctx.lineWidth = 2;
    for (let x = 40; x < w; x += 70) {
        ctx.beginPath(); ctx.moveTo(320, 275); ctx.lineTo(x, h); ctx.stroke();
    }
    // Dock lights lead the eye toward the reunited family.
    ctx.fillStyle = '#FFAA22';
    for (let x = 205; x < 435; x += 24) ctx.fillRect(x, 268, 12, 7);
    ctx.fillStyle = '#55FFFF';
    ctx.fillRect(74, 84, 5, 178);
    ctx.fillRect(561, 84, 5, 178);
    ctx.fillStyle = '#55FFFF';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('KERONA DOCKING BAY', w / 2, 56);
    ctx.fillStyle = 'rgba(255,190,100,0.12)';
    ctx.beginPath(); ctx.arc(320, 286, 62, 0, Math.PI * 2); ctx.fill();

    const people = [
        { x: 286, height: 48, body: '#9b694f', skin: '#d8a07e', face: 1 },
        { x: 354, height: 44, body: '#805b43', skin: '#d8a07e', face: -1 },
        { x: 320, height: 28, body: '#5b7fa0', skin: '#e0aa88', face: 0 }
    ];
    people.forEach((person) => {
        const y = 310;
        ctx.fillStyle = person.body;
        ctx.fillRect(person.x - 7, y - person.height, 14, person.height - 12);
        ctx.fillStyle = person.skin;
        ctx.fillRect(person.x - 6, y - person.height - 12, 12, 12);
        ctx.fillStyle = '#35251f';
        ctx.fillRect(person.x - 6, y - person.height - 12, 12, 3);
        ctx.fillStyle = '#2c2630';
        ctx.fillRect(person.x - 6, y - 12, 5, 12);
        ctx.fillRect(person.x + 1, y - 12, 5, 12);
        // Outstretched arms turn three blocks into an unmistakable reunion.
        if (person.face) {
            ctx.fillStyle = person.body;
            const armX = person.face > 0 ? person.x + 7 : person.x - 18;
            ctx.fillRect(armX, y - person.height + 8, 11, 5);
            ctx.fillStyle = person.skin;
            ctx.fillRect(person.face > 0 ? armX + 9 : armX, y - person.height + 8, 3, 5);
        }
    });
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Courier New"';
    ctx.fillText('SOME PROMISES MAKE IT HOME.', w / 2, h - 34);
    ctx.textAlign = 'left';
}

// CUTSCENE 4: Victory Escape
function cutsceneVictoryEscape(ctx, w, h, progress, elapsed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    if (progress < 0.25) {
        // Phase 1: Running through Draknoid corridors
        const p = progress / 0.25;
        // Dark green corridor
        ctx.fillStyle = '#1a2818';
        ctx.fillRect(0, 0, w, h);
        // Perspective corridor lines
        const cx = w / 2, cy = h / 2;
        ctx.strokeStyle = '#2a3a28';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const d = (i * 0.15 + p * 0.4) % 1;
            const sz = d * 200;
            ctx.strokeRect(cx - sz, cy - sz * 0.6, sz * 2, sz * 1.2);
        }
        // Floor
        ctx.fillStyle = '#0f1a0f';
        ctx.fillRect(0, h * 0.65, w, h * 0.35);
        // Running player — same janitor palette as the in-room sprite
        const runFrame = Math.floor(elapsed / 150) % 2;
        const px = w * 0.5 + Math.sin(elapsed * 0.005) * 10;
        const groundY = h * 0.65;
        // Body
        ctx.fillStyle = PLAYER_PALETTE.suit;
        ctx.fillRect(px - 6, groundY - 35, 12, 25);
        ctx.fillStyle = PLAYER_PALETTE.suitShadow;
        ctx.fillRect(px - 6, groundY - 35, 2, 25);
        ctx.fillStyle = PLAYER_PALETTE.belt;
        ctx.fillRect(px - 6, groundY - 13, 12, 3);
        // Head
        ctx.fillStyle = PLAYER_PALETTE.skin;
        ctx.fillRect(px - 5, groundY - 49, 10, 9);
        ctx.fillStyle = PLAYER_PALETTE.hair;
        ctx.fillRect(px - 5, groundY - 51, 10, 4);
        // Legs (running animation)
        ctx.fillStyle = PLAYER_PALETTE.legs;
        if (runFrame) {
            ctx.fillRect(px - 5, groundY - 10, 4, 14);
            ctx.fillRect(px + 3, groundY - 8, 4, 10);
        } else {
            ctx.fillRect(px - 5, groundY - 8, 4, 10);
            ctx.fillRect(px + 3, groundY - 10, 4, 14);
        }
        ctx.fillStyle = PLAYER_PALETTE.boots;
        ctx.fillRect(px - 5, groundY + 2, 4, 3);
        ctx.fillRect(px + 3, groundY + 2, 4, 3);
        // Arm swinging from the shoulder, carrying the drive
        ctx.fillStyle = PLAYER_PALETTE.suit;
        ctx.fillRect(px + 6, groundY - 33, 3, 6);
        ctx.fillStyle = PLAYER_PALETTE.skin;
        ctx.fillRect(px + 6 + runFrame * 2, groundY - 27, 3, 5);
        // Holding Quantum Drive (AGI-style: solid color halo)
        ctx.fillStyle = '#55FFFF';
        ctx.fillRect(px + 6 + runFrame * 2, groundY - 30, 10, 10);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px + 8 + runFrame * 2, groundY - 28, 6, 6);
        // Red alarm flashing
        if (Math.floor(elapsed / 250) % 2) {
            ctx.fillStyle = 'rgba(255,0,0,0.1)';
            ctx.fillRect(0, 0, w, h);
        }
        // Text
        ctx.fillStyle = '#ff4';
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('INTRUDER ALERT! INTRUDER ALERT!', w / 2, 25);
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.fillText('Sprint for the airlock!', w / 2, h - 20);
        ctx.textAlign = 'left';
    } else if (progress < 0.5) {
        // Phase 2: Shuttle launching from flagship
        const p = (progress - 0.25) / 0.25;
        stars(ctx, w, h, 33333, 180);
        // Draknoid ship
        drawDraknoidShip(ctx, w * 0.5 + p * 100, h * 0.5, 3 - p);
        // Shuttle breaking away
        const sx = w * 0.4 - p * 200;
        const sy = h * 0.5 - p * 50;
        drawShuttleCraft(ctx, sx, sy, 2 + p, Math.PI + 0.1);
        // Big engine flare
        ctx.fillStyle = '#f84';
        ctx.fillRect(sx + 25 + p * 5, sy - 4, 15 + p * 20, 8);
        ctx.fillStyle = '#ff4';
        ctx.fillRect(sx + 25 + p * 5, sy - 2, 10 + p * 12, 4);
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Blasting away from the flagship!', w / 2, h - 20);
        ctx.textAlign = 'left';
    } else if (progress < 0.75) {
        // Phase 3: Chase - Draknoid ship pursuing
        const p = (progress - 0.5) / 0.25;
        stars(ctx, w, h, 33333, 180);
        // Speed lines
        for (let i = 0; i < 10; i++) {
            const sy = 30 + (i * 53 + Math.floor(elapsed * 0.12)) % (h - 40);
            ctx.strokeStyle = 'rgba(180,200,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(((i * 83 + elapsed * 0.5) % (w + 40)) - 40, sy);
            ctx.lineTo(((i * 83 + elapsed * 0.5) % (w + 40)), sy);
            ctx.stroke();
        }
        // Draknoid ship behind, shooting
        const dsx = w * 0.75 - p * 30;
        drawDraknoidShip(ctx, dsx, h * 0.5 + Math.sin(elapsed * 0.004) * 10, 1.5);
        // Green plasma bolts
        for (let i = 0; i < 3; i++) {
            const bx = dsx - 80 - ((elapsed * 0.5 + i * 200) % 400);
            const by = h * 0.5 + Math.sin(elapsed * 0.004 + i) * 15;
            if (bx > 100) {
                // AGI-style: solid halo instead of shadowBlur
                ctx.fillStyle = '#55FF55';
                ctx.fillRect(bx - 8, by - 3, 16, 6);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(bx - 6, by - 1, 12, 2);
            }
        }
        // Shuttle ahead, evading
        const shuttle_bob = Math.sin(elapsed * 0.006) * 8;
        drawShuttleCraft(ctx, w * 0.25, h * 0.48 + shuttle_bob, 2.5, Math.PI);
        // Engine boost
        ctx.fillStyle = '#f84';
        ctx.fillRect(w * 0.25 + 30, h * 0.48 + shuttle_bob - 3, 20, 6);
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('They\'re right behind us!', w / 2, h - 20);
        ctx.textAlign = 'left';
    } else {
        // Phase 4: Hyperspace jump!
        const p = (progress - 0.75) / 0.25;
        if (engine.getFlag('rescued_prisoners') && p >= 0.35) {
            drawPipzReunion(ctx, w, h);
            return;
        }
        // Hyperspace effect: star tunnel
        const cx = w / 2, cy = h / 2;
        // Blue-white tunnel
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2 + elapsed * 0.002;
            const dist = (1 - p * 0.3) * 200 + i * 3;
            const len = 10 + p * 80;
            const sx = cx + Math.cos(angle) * dist;
            const sy = cy + Math.sin(angle) * dist * 0.5;
            const ex = cx + Math.cos(angle) * (dist + len);
            const ey = cy + Math.sin(angle) * (dist + len) * 0.5;
            ctx.strokeStyle = `rgba(${150 + i * 2},${200 + i},255,${0.3 + p * 0.4})`;
            ctx.lineWidth = 1 + p;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }
        // Central bright flash growing
        const flashR = p * 200;
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, flashR);
        grd.addColorStop(0, `rgba(255,255,255,${p * 0.8})`);
        grd.addColorStop(0.5, `rgba(100,180,255,${p * 0.4})`);
        grd.addColorStop(1, 'rgba(0,0,40,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
        // Shuttle shrinking into hyperspace
        if (p < 0.7) {
            drawShuttleCraft(ctx, cx, cy, 2.5 * (1 - p), Math.PI);
        }
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Courier New"';
        ctx.textAlign = 'center';
        if (p < 0.5) {
            ctx.fillText('Engaging Hyperspace!', w / 2, h - 20);
        } else {
            ctx.font = 'bold 20px "Courier New"';
            ctx.fillText('★ MISSION COMPLETE ★', w / 2, h / 2 + 80);
        }
        ctx.textAlign = 'left';
    }
}

// ========== SHARED ENVIRONMENT DRAWING HELPERS ==========

/**
 * Draw a sci-fi computer terminal panel.
 * statusLines: array of { text, color }
 * powered: bool
 */
function drawComputerTerminal(ctx, x, y, w, h, statusLines, powered) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w - 2, y + 2, 2, h - 2);
    ctx.fillRect(x + 2, y + h - 2, w - 2, 2);
    const sw = w - 20, sh = Math.floor(h * 0.55);
    const sx = x + 10, sy = y + 10;
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
    ctx.fillStyle = '#1a2030';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = powered ? '#112244' : '#0a0a0a';
    ctx.fillRect(sx + 4, sy + 4, sw - 8, sh - 8);
    if (powered && statusLines && statusLines.length) {
        const lineH = Math.min(14, Math.floor((sh - 16) / statusLines.length));
        statusLines.forEach((line, i) => {
            ctx.fillStyle = line.color || '#33AA55';
            ctx.font = '9px "Courier New"';
            ctx.fillText(line.text, sx + 8, sy + 12 + i * lineH);
        });
    }
    ctx.fillStyle = '#383848';
    ctx.fillRect(x + 14, y + sh + 16, w - 28, 12);
    ctx.fillStyle = '#444458';
    for (let kx = x + 18; kx < x + w - 14; kx += 7) {
        ctx.fillRect(kx, y + sh + 18, 4, 3);
        ctx.fillRect(kx + 2, y + sh + 23, 4, 3);
    }
    ctx.fillStyle = powered ? '#22FF44' : '#AA2222';
    ctx.fillRect(x + w - 14, y + h - 14, 6, 6);
}

/**
 * Draw a sci-fi doorway hatch at (x,y) with size (w,h).
 * open: bool. glowColor: css color for frame strip.
 */
function drawDoorway(ctx, x, y, w, h, label, open, glowColor) {
    const gc = glowColor || '#5a7088';
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 5, y - 5, w + 10, h + 10);
    if (open) {
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#550000';
        for (let yy = y + 4; yy < y + h - 4; yy += 8) ctx.fillRect(x + 4, yy, w - 8, 3);
        ctx.fillStyle = gc;
        ctx.fillRect(x - 4, y, 4, h);
        ctx.fillRect(x + w, y, 4, h);
        ctx.fillRect(x, y - 4, w, 4);
    } else {
        ctx.fillStyle = '#4e5e72';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#5a7088';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        ctx.strokeStyle = '#3a4e60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.floor(w / 2), y + 4);
        ctx.lineTo(x + Math.floor(w / 2), y + h - 4);
        ctx.stroke();
        ctx.lineWidth = 1;
        if (label) {
            ctx.font = '9px "Courier New"';
            ctx.fillStyle = '#88AACC';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + w / 2, y + h / 2 + 4);
            ctx.textAlign = 'left';
        }
    }
}

/**
 * Draw an animated fire/glow effect centered at (cx, cy).
 * r: radius, intensity: 0..1, animTimer: ms elapsed.
 */
function drawFireEffect(ctx, cx, cy, r, intensity, animTimer) {
    const flicker = 0.7 + Math.sin(animTimer / 80) * 0.3;
    const fi = (intensity || 0.8) * flicker;
    const fr = Math.max(4, Math.round(r * fi));
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - fr - 3, cy - fr - 3, fr * 2 + 6, fr * 2 + 6);
    ctx.fillStyle = '#AA0000';
    ctx.fillRect(cx - fr, cy - fr, fr * 2, fr * 2);
    ctx.fillStyle = '#FF5555';
    ctx.fillRect(cx - Math.round(fr * 0.65), cy - fr - 2, Math.round(fr * 1.3), fr * 2);
    ctx.fillStyle = '#FFFF55';
    ctx.fillRect(cx - Math.round(fr * 0.3), cy - fr + 2, Math.round(fr * 0.6), Math.round(fr * 1.2));
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
        const ang = animTimer * 0.003 + i * 1.26;
        const dist = r * 0.6 + Math.sin(animTimer * 0.007 + i) * r * 0.3;
        ctx.fillRect(cx + Math.cos(ang) * dist - 1, cy + Math.sin(ang) * dist - 1, 2, 2);
    }
}

/**
 * Draw a rising smoke wisp column from (bx, by).
 * height: pixels. animTimer: ms elapsed.
 */
function drawSmokeWisp(ctx, bx, by, height, animTimer) {
    const phases = [0, 0.33, 0.67];
    phases.forEach((offset, i) => {
        const t = ((animTimer / 1200 + offset) % 1);
        const px = bx + Math.sin(t * Math.PI * 2 + i) * 8;
        const py = by - t * height;
        const size = 4 + Math.round(t * 10);
        ctx.fillStyle = t < 0.45 ? '#555555' : '#AAAAAA';
        ctx.fillRect(Math.round(px - size / 2), Math.round(py - size / 2), size, Math.max(3, Math.round(size / 2)));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(Math.round(px - size / 2) + 1, Math.round(py - size / 2) + 1, Math.max(2, Math.round(size / 3)), 1);
    });
}

/**
 * Draw prison cell bars spanning full height of a column at x.
 * barCount: number of vertical bars across w.
 */
function drawPrisonBars(ctx, x, y, w, h, barCount) {
    const n = barCount || 6;
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#334455';
    // Horizontal rails
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y + h - 6, w, 6);
    ctx.fillRect(x, y + Math.floor(h / 2) - 3, w, 6);
    // Vertical bars
    ctx.fillStyle = '#445566';
    for (let i = 0; i <= n; i++) {
        const bx = x + Math.floor(i * w / n) - 2;
        ctx.fillRect(bx, y, 4, h);
        // Rivet
        ctx.fillStyle = '#556677';
        ctx.fillRect(bx + 1, y + 4, 2, 2);
        ctx.fillStyle = '#445566';
    }
}

// CUTSCENE 5: Freighter crash
function cutsceneFreighterCrash(ctx, w, h, progress, elapsed) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    stars(ctx, w, h, 54321, 180);

    if (progress < 0.3) {
        const p = progress / 0.3;
        const fx = w * 0.8 - p * 100;
        const fy = h * 0.3 + Math.sin(p * Math.PI) * 30;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(0.15 + p * 0.2);
        drawFreighter(ctx, 0, 0, 0.5, false);
        ctx.restore();
        drawFireEffect(ctx, fx - 40, fy + 5, 14, 0.7, elapsed);
        drawSmokeWisp(ctx, fx - 35, fy, 50, elapsed);
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('Ironclad Star — Distress Signal Detected', w / 2, h - 30);
        ctx.textAlign = 'left';
    } else if (progress < 0.65) {
        const p = (progress - 0.3) / 0.35;
        const skyG = ctx.createLinearGradient(0, 0, 0, h);
        skyG.addColorStop(0, 'rgba(0,0,0,' + (1 - p * 0.6) + ')');
        skyG.addColorStop(1, 'rgba(' + Math.floor(180 * p) + ',' + Math.floor(70 * p) + ',0,' + (p * 0.7) + ')');
        ctx.fillStyle = skyG;
        ctx.fillRect(0, 0, w, h);
        const fx = w * 0.5 + p * 60, fy = h * 0.25 + p * h * 0.35;
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(0.35 + p * 0.5);
        drawFreighter(ctx, 0, 0, 0.45, true); ctx.restore();
        for (let i = 0; i < 4; i++) {
            const dx = fx - 20 + i * 15 + Math.sin(elapsed * 0.003 + i) * p * 25;
            const dy = fy + p * (20 + i * 15);
            ctx.fillStyle = '#556677';
            ctx.save(); ctx.translate(dx, dy); ctx.rotate(p * 2 + i); ctx.fillRect(-6, -4, 12, 8); ctx.restore();
            drawFireEffect(ctx, dx, dy, 8 + i * 3, 0.6 + p * 0.3, elapsed + i * 300);
        }
        ctx.fillStyle = '#fff'; ctx.font = '14px "Courier New"'; ctx.textAlign = 'center';
        ctx.fillText('Hull failure imminent!', w / 2, h - 30); ctx.textAlign = 'left';
    } else {
        const p = (progress - 0.65) / 0.35;
        gradientRect(ctx, 0, h * 0.65, w, h * 0.35, '#c08030', '#a06820');
        gradientRect(ctx, 0, 0, w, h * 0.65, '#AA5500', '#CC8830');
        const cr = p * 180;
        ctx.fillStyle = 'rgba(180,140,80,' + (0.5 - p * 0.3) + ')';
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.65, cr, Math.PI, 0); ctx.fill();
        if (p > 0.4) {
            const wp = (p - 0.4) / 0.6;
            ctx.fillStyle = 'rgba(50,60,70,' + wp + ')';
            ctx.fillRect(w * 0.35, h * 0.63, w * 0.3, 8);
        }
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px "Courier New"'; ctx.textAlign = 'center';
        ctx.fillText('CRASH SITE LOCATED', w / 2, h - 30); ctx.textAlign = 'left';
    }
}

// CUTSCENE 6: Brig prisoner rescue
function cutsceneBrigRescue(ctx, w, h, progress, elapsed, releaseMethod) {
    ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, 0, w, h);
    if (progress < 0.35) {
        const p = progress / 0.35;
        ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, 0, w, h);
        drawDoorway(ctx, w * 0.35, h * 0.15, w * 0.3, h * 0.65, 'BRIG-7', false, '#2a5a2a');
        if (releaseMethod === 'prisoner_badge') {
            const readerX = w * 0.68, readerY = h * 0.48;
            ctx.fillStyle = '#333344'; ctx.fillRect(readerX - 18, readerY - 30, 36, 60);
            ctx.fillStyle = Math.floor(elapsed / 180) % 2 ? '#55FF55' : '#228822';
            ctx.fillRect(readerX - 11, readerY - 20, 22, 14);
            ctx.fillStyle = '#CCCC88'; ctx.fillRect(readerX - 15, readerY + 2, 30, 16);
            ctx.fillStyle = '#334455'; ctx.fillRect(readerX - 12, readerY + 5, 24, 10);
            ctx.fillStyle = '#8f8'; ctx.font = '12px "Courier New"'; ctx.textAlign = 'center';
            ctx.fillText('CLEARANCE ACCEPTED', w / 2, h - 30); ctx.textAlign = 'left';
        } else {
            const cutY = h * 0.15 + p * h * 0.65;
            ctx.fillStyle = 'rgba(255,200,50,' + (0.9 - p * 0.2) + ')';
            ctx.beginPath(); ctx.arc(w * 0.35, cutY, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,200,0.6)';
            ctx.beginPath(); ctx.arc(w * 0.35, cutY, 2, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 5; i++) {
                const sx = w * 0.35 + Math.cos(elapsed * 0.02 + i) * (3 + i * 2);
                const sy = cutY + Math.sin(elapsed * 0.015 + i) * (3 + i);
                ctx.fillStyle = 'rgba(255,220,80,' + (0.7 - i * 0.1) + ')';
                ctx.fillRect(sx, sy, 2, 2);
            }
            ctx.fillStyle = '#ff8'; ctx.font = '12px "Courier New"'; ctx.textAlign = 'center';
            ctx.fillText('Cutting through...', w / 2, h - 30); ctx.textAlign = 'left';
        }
    } else if (progress < 0.65) {
        const p = (progress - 0.35) / 0.3;
        ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, 0, w, h);
        drawDoorway(ctx, w * 0.35, h * 0.15, w * 0.3, h * 0.65, null, true);
        // Prisoners emerging
        const p1x = w * 0.5 + p * 60;
        const p2x = w * 0.5 + p * 36;
        ctx.fillStyle = '#AA7755';
        ctx.fillRect(p1x, h * 0.55, 12, 25);
        ctx.beginPath(); ctx.arc(p1x + 6, h * 0.52, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#886644';
        ctx.fillRect(p2x, h * 0.6, 12, 22);
        ctx.beginPath(); ctx.arc(p2x + 6, h * 0.57, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '12px "Courier New"'; ctx.textAlign = 'center';
        ctx.fillText('"They\'re alive!"', w / 2, h - 30); ctx.textAlign = 'left';
    } else {
        const p = (progress - 0.65) / 0.35;
        ctx.fillStyle = '#0a1a0a'; ctx.fillRect(0, 0, w, h);
        if (Math.floor(elapsed / 300) % 2) { ctx.fillStyle = 'rgba(255,0,0,0.08)'; ctx.fillRect(0, 0, w, h); }
        const run = Math.floor(elapsed / 160) % 2;
        const baseX = w * 0.55 - p * 180;
        for (let i = 0; i < 5; i++) {
            const bx = baseX + i * 18, by = h * 0.78 - (i % 2) * 5;
            ctx.fillStyle = i === 0 ? PLAYER_PALETTE.suit : '#AA7755';
            ctx.fillRect(bx - 4, by - 20, 8, 16);
            ctx.fillStyle = i === 0 ? '#FFCC88' : '#CC9977';
            ctx.beginPath(); ctx.arc(bx, by - 24, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = i === 0 ? PLAYER_PALETTE.legs : '#553322';
            if (run) { ctx.fillRect(bx - 3, by - 4, 3, 8); ctx.fillRect(bx, by - 2, 3, 6); }
            else { ctx.fillRect(bx - 3, by - 2, 3, 6); ctx.fillRect(bx, by - 4, 3, 8); }
        }
        ctx.fillStyle = '#ff4'; ctx.font = 'bold 14px "Courier New"'; ctx.textAlign = 'center';
        ctx.fillText('GO GO GO!', w / 2, 30);
        ctx.fillStyle = '#fff'; ctx.font = '12px "Courier New"';
        ctx.fillText('Sprint for the airlock!', w / 2, h - 30); ctx.textAlign = 'left';
    }
}

function releasePrisoners(e, itemId, successMessage) {
    if (e.getFlag('brig_cells_open')) {
        e.showMessage('The cells are already open.');
        return;
    }
    if (itemId === 'prisoner_badge') {
        e.removeFromInventory('prisoner_badge');
    }
    e.setFlag('brig_cells_open');
    e.setFlag('rescued_prisoners');
    e.addScore(30);
    e.playCutscene({
        duration: 6500,
        skippable: true,
        draw: (ctx, w, h, prog, elapsed) => cutsceneBrigRescue(ctx, w, h, prog, elapsed, itemId),
        onEnd: () => {
            e.goToRoom('draknoid_ship', 200, 310);
            e.showMessage(successMessage);
        }
    });
}

// ========== MINI-ANIMATION HELPERS ==========
function miniAnimRedrawRoom(ctx, w, h) {
    const room = engine.rooms[engine.currentRoomId];
    if (room && room.draw) room.draw(ctx, w, h, engine);
}

const PLAYER_PALETTE = PAL.PLAYER;

function drawPlayerBody(ctx, px, py, s, armAngle, drawShadow = true) {
    // One character definition: the cutscene cel is literally the in-room
    // front-facing sprite, so the ego can never drift between them.
    if (drawShadow) engine.drawContactShadow(ctx, px, py + 12 * s, s);
    engine.drawEgoFront(ctx, px, py, s, { armAngle: armAngle || 0 });
}

function drawPlayerWakePose(ctx, px, groundY, s, pose) {
    const P = PAL.PLAYER;
    const crouched = pose === 'crouched';
    engine.drawContactShadow(ctx, px + 3 * s, groundY, s, {
        rx: crouched ? 9 : 12,
        ry: 2.2,
        alpha: 0.27,
        light: null
    });

    ctx.save();
    ctx.translate(px, groundY);
    ctx.scale(s, s);

    // Bent legs form a compact zig-zag instead of one rotating body axis.
    ctx.fillStyle = P.legs;
    if (crouched) {
        ctx.fillRect(-5, -8, 5, 7);
        ctx.fillRect(1, -7, 5, 6);
        ctx.fillStyle = P.legHighlight;
        ctx.fillRect(-4, -7, 1, 5);
        ctx.fillRect(2, -6, 1, 4);
        ctx.fillStyle = P.boots;
        ctx.fillRect(-6, -2, 6, 2);
        ctx.fillRect(1, -2, 7, 2);
    } else {
        ctx.fillRect(1, -8, 8, 4);
        ctx.fillRect(8, -7, 4, 6);
        ctx.fillStyle = P.legHighlight;
        ctx.fillRect(2, -7, 6, 1);
        ctx.fillRect(9, -6, 1, 4);
        ctx.fillStyle = P.boots;
        ctx.fillRect(9, -2, 7, 2);
        ctx.fillRect(5, -4, 6, 2);
    }

    const torsoY = crouched ? -18 : -21;
    ctx.fillStyle = P.suit;
    ctx.fillRect(-4, torsoY, 8, 11);
    ctx.fillStyle = P.suitShadow;
    ctx.fillRect(2, torsoY, 2, 11);
    ctx.fillStyle = P.suitOutline;
    ctx.fillRect(-4, torsoY, 1, 11);
    ctx.fillStyle = P.belt;
    ctx.fillRect(-4, torsoY + 9, 8, 2);
    ctx.fillStyle = P.collar;
    ctx.fillRect(-2, torsoY, 4, 1);

    // One arm braces on the deck; the other rests across the raised knee.
    ctx.fillStyle = P.suit;
    ctx.fillRect(-7, torsoY + 2, 3, 8);
    ctx.fillRect(4, torsoY + 3, crouched ? 5 : 7, 3);
    ctx.fillStyle = P.gloves;
    ctx.fillRect(-8, torsoY + 9, 4, 2);
    ctx.fillRect(crouched ? 8 : 10, torsoY + 3, 3, 3);

    const headY = torsoY - 8;
    ctx.fillStyle = P.skin;
    ctx.fillRect(-3, headY, 7, 7);
    ctx.fillStyle = P.skinShadow;
    ctx.fillRect(2, headY + 2, 2, 5);
    ctx.fillStyle = P.hair;
    ctx.fillRect(-4, headY - 1, 8, 3);
    ctx.fillRect(-4, headY + 1, 2, 4);
    ctx.fillStyle = P.eyeWhite;
    ctx.fillRect(1, headY + 3, 2, 1);
    ctx.fillStyle = P.iris;
    ctx.fillRect(2, headY + 3, 1, 1);
    ctx.restore();
}

/**
 * Draw the player lying down (sleeping / waking).
 * bx = left edge of head, cy = vertical CENTRE of the lying body.
 * Derived from the same VGA proportions as drawEgoFront, rotated 90 degrees.
 * eyeOpen: 0 = closed, 1 = fully open.
 */
function drawPlayerSleeping(ctx, bx, cy, eyeOpen, drawShadow = true) {
    const s = engine.playerSpriteScale(310);
    const P = PAL.PLAYER;
    // Horizontal reference points, head at the left, boots at the right.
    const headX = bx;            // back of the skull
    const faceX = bx + 3.4 * s;  // front of the face
    const bodyX = bx + 6.4 * s;  // shoulders
    const beltX = bodyX + 12 * s;
    const legX  = beltX + 1.8 * s;
    const bootX = legX + 12 * s;

    if (drawShadow) {
        engine.drawContactShadow(ctx, bodyX + 6 * s, cy + 5 * s, s, { rx: 20 * s, ry: 2.4 * s, alpha: 0.22 });
    }

    // Far arm and leg first so the body overlaps them.
    ctx.fillStyle = P.suitShadow;
    ctx.fillRect(bodyX + 1 * s, cy + 2.6 * s, 9 * s, 1.9 * s);
    ctx.fillStyle = P.gloveFaded;
    ctx.fillRect(bodyX + 9.6 * s, cy + 2.6 * s, 2.2 * s, 1.9 * s);
    ctx.fillStyle = P.legs;
    ctx.fillRect(legX, cy + 0.6 * s, 12 * s, 2.8 * s);

    // Near leg, then boots.
    ctx.fillStyle = P.legs;
    ctx.fillRect(legX, cy - 3.2 * s, 12 * s, 2.8 * s);
    ctx.fillStyle = P.legHighlight;
    ctx.fillRect(legX + 1 * s, cy - 2.8 * s, 9 * s, 0.9 * s);
    ctx.fillStyle = P.kneePatch;
    ctx.fillRect(legX + 4 * s, cy - 3.2 * s, 2.6 * s, 2.8 * s);
    ctx.fillStyle = P.boots;
    ctx.fillRect(bootX, cy - 3.6 * s, 3 * s, 3.2 * s);
    ctx.fillRect(bootX, cy + 0.4 * s, 3 * s, 3.2 * s);
    ctx.fillStyle = P.bootHighlight;
    ctx.fillRect(bootX + 0.4 * s, cy - 3.2 * s, 0.8 * s, 2.4 * s);

    // Torso
    ctx.fillStyle = P.suit;
    ctx.fillRect(bodyX, cy - 4 * s, 12 * s, 8 * s);
    ctx.fillStyle = P.suitOutline;
    ctx.fillRect(bodyX, cy - 4 * s, 12 * s, 0.8 * s);
    ctx.fillRect(bodyX, cy + 3.2 * s, 12 * s, 0.8 * s);
    ctx.fillStyle = P.suitShadow;
    ctx.fillRect(bodyX, cy + 1.4 * s, 12 * s, 1.8 * s);
    // Collar at the neck end, belt at the waist end.
    ctx.fillStyle = P.collar;
    ctx.fillRect(bodyX, cy - 3.2 * s, 1.2 * s, 6.4 * s);
    ctx.fillStyle = P.belt;
    ctx.fillRect(beltX - 1.6 * s, cy - 4 * s, 1.8 * s, 8 * s);
    ctx.fillStyle = P.buckle;
    ctx.fillRect(beltX - 1.4 * s, cy - 1.2 * s, 1.4 * s, 2.4 * s);
    ctx.fillStyle = P.toolPouch;
    ctx.fillRect(beltX - 1.2 * s, cy - 5.6 * s, 2.6 * s, 1.7 * s);
    ctx.fillStyle = P.cleaningRag;
    ctx.fillRect(beltX - 0.6 * s, cy + 3.4 * s, 2 * s, 1.7 * s);
    ctx.fillStyle = P.workPatch;
    ctx.fillRect(bodyX + 3 * s, cy - 3.6 * s, 1.8 * s, 2.2 * s);
    ctx.fillStyle = P.workPatchDark;
    ctx.fillRect(bodyX + 3.5 * s, cy - 2.8 * s, 0.9 * s, 0.9 * s);

    // Near arm resting on top of the body.
    ctx.fillStyle = P.suit;
    ctx.fillRect(bodyX + 1 * s, cy - 6.2 * s, 9 * s, 1.9 * s);
    ctx.fillStyle = P.gloves;
    ctx.fillRect(bodyX + 9.6 * s, cy - 6.2 * s, 2.2 * s, 1.9 * s);

    // Hair wraps the back of the skull; the face points up-screen.
    ctx.fillStyle = P.hair;
    ctx.fillRect(headX, cy - 3.4 * s, 2.6 * s, 6.8 * s);
    ctx.fillRect(headX + 2 * s, cy - 4.2 * s, 3.4 * s, 2 * s);
    ctx.fillStyle = P.hairHighlight;
    ctx.fillRect(headX + 2.4 * s, cy - 4 * s, 2.2 * s, 0.7 * s);
    ctx.fillStyle = P.skin;
    ctx.fillRect(headX + 2.2 * s, cy - 2.4 * s, 4.4 * s, 5 * s);
    ctx.fillStyle = P.skinShadow;
    ctx.fillRect(headX + 2.2 * s, cy + 1.6 * s, 4.4 * s, 1 * s);
    // Nose points away from the pillow.
    ctx.fillRect(faceX + 1.4 * s, cy - 0.6 * s, 1.3 * s, 1.2 * s);
    // Closed lids read as two dark lines; open eyes reveal the iris.
    const eyeH = Math.max(0.4 * s, 1.3 * s * (eyeOpen || 0));
    ctx.fillStyle = (eyeOpen || 0) > 0.15 ? P.eyeWhite : P.hairDark;
    ctx.fillRect(faceX + 0.2 * s, cy - 2 * s, 1.4 * s, eyeH);
    ctx.fillRect(faceX + 0.2 * s, cy + 0.9 * s, 1.4 * s, eyeH);
    if ((eyeOpen || 0) > 0.15) {
        ctx.fillStyle = P.iris;
        ctx.fillRect(faceX + 0.5 * s, cy - 2 * s, 0.9 * s, eyeH);
        ctx.fillRect(faceX + 0.5 * s, cy + 0.9 * s, 0.9 * s, eyeH);
    }
    ctx.fillStyle = P.smile;
    ctx.fillRect(faceX + 2.6 * s, cy - 0.4 * s, 0.5 * s, 1.4 * s);
}

