// ============================================================
// STAR SWEEPER - ISS CONSTELLATION (engine room)
// ============================================================

StarSweeper.defineRooms((engine) => {
    function douseConduitFire(e) {
        if (e.getFlag('fire_suppressed')) {
            e.showMessage('The fire is already out.');
            return;
        }
        e.setFlag('fire_suppressed');
        e.addScore(5);
        e.showMessage('You pull the suppression canister from the cabinet and blast the conduit fire. The flames gutter out with a satisfying hiss. The room smells of chemical foam and char.');
    }

    // ========== ROOM 11: ENGINE ROOM ==========
    engine.registerRoom({
        id: 'engine_room',
        hint: (e) => {
            if (!e.getFlag('cabinet_opened')) return 'The fire suppression cabinet on the left wall is locked. Plasma cutters are good at locks. Korvak has one.';
            if (!e.hasItem('medkit') && !e.getFlag('korvak_freed')) return 'Open the cabinet and take the medkit. Then use it on Korvak.';
            if (!e.getFlag('korvak_freed')) return 'Use the medkit on Korvak.';
            if (!e.getFlag('fire_suppressed')) return 'That conduit fire is still burning on the right wall. The cabinet holds a suppression canister — use the fire itself to grab it and put the flames out.';
            return 'You are done here. Time to deal with the Draknoids.';
        },
        name: 'Engine Room',
        description: 'The ship\'s engine room. Emergency lighting casts everything in sickly red. The smell of burnt circuitry and hydraulic fluid hangs heavy in the air.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            e.setDepthScaling(260, 360, 0.7, 1.1);
            // Beam wreckage barrier — can't walk through collapsed structure
            e.addBarrier(280, 295, 160, 25);
            // Central reactor column
            e.addBarrier(290, 220, 60, 120);
            // Korvak's body is solid ground clutter, not something to stand inside.
            if (!e.getFlag('korvak_left')) e.addBarrier(218, 300, 46, 52);

            // Ruptured coolant main across the near deck gives the empty
            // foreground a plane for the ego to walk behind.
            e.addForegroundLayer(384, (ctx, eng) => {
                const seg = (x0, x1) => {
                    ctx.fillStyle = '#0d0a12'; ctx.fillRect(x0, 358, x1 - x0, 24);
                    ctx.fillStyle = '#453a4e'; ctx.fillRect(x0, 362, x1 - x0, 16);
                    ctx.fillStyle = '#6d6086'; ctx.fillRect(x0, 362, x1 - x0, 3);
                    ctx.fillStyle = 'rgba(190,70,40,0.16)'; ctx.fillRect(x0, 362, x1 - x0, 16);
                    ctx.fillStyle = '#241b28';
                    for (let fx = x0 + 14; fx < x1 - 8; fx += 48) ctx.fillRect(fx, 358, 8, 24);
                };
                seg(0, 214);
                seg(426, 640);
                const puff = Math.floor(eng.animTimer / 260) % 4;
                ctx.fillStyle = 'rgba(220,210,225,' + (0.24 - puff * 0.05) + ')';
                ctx.beginPath(); ctx.ellipse(222 + puff * 6, 354 - puff * 10, 12 + puff * 5, 7 + puff * 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(220,210,225,' + (0.17 - puff * 0.035) + ')';
                ctx.beginPath(); ctx.ellipse(418 - puff * 5, 350 - puff * 9, 10 + puff * 4, 6 + puff * 2, 0, 0, Math.PI * 2); ctx.fill();
            });

            // Korvak draws as a y-sorted actor so the player passes behind him
            // correctly; the beam segment is re-drawn over his legs to pin him.
            e.addForegroundLayer(352, (ctx, eng) => {
                if (!eng.getFlag('korvak_freed')) {
                    eng.drawContactShadow(ctx, 240, 358, 1, { rx: 28, ry: 4, alpha: 0.28 });
                    // The shared VGA cel is rotated into a pinned pose so Korvak
                    // keeps the same proportions and material detail as other NPCs.
                    ctx.save();
                    ctx.translate(278, 342);
                    ctx.rotate(-Math.PI / 2);
                    drawVgaPerson(ctx, 0, 0, 1.7, Object.assign({}, CIV_KORVAK, {
                        farArm: { side: -1, up: -0.7, lo: 0.4 },
                        nearArm: { side: 1, up: 0.5, lo: -0.3 }
                    }));
                    ctx.restore();
                    ctx.fillStyle = 'rgba(160,20,20,0.5)';
                    ctx.beginPath(); ctx.ellipse(238, 357, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
                    // Beam segment re-drawn over his legs to pin him
                    ctx.save();
                    ctx.beginPath(); ctx.rect(224, 290, 62, 34); ctx.clip();
                    ctx.translate(320, 310); ctx.rotate(-0.1);
                    ctx.fillStyle = '#241c2e';
                    ctx.fillRect(-90, -8, 180, 16);
                    ctx.fillStyle = '#4a3f56';
                    ctx.fillRect(-90, -8, 180, 4);
                    ctx.fillStyle = '#6d5f7c';
                    ctx.fillRect(-90, -10, 180, 3);
                    ctx.fillStyle = '#8f7fa2';
                    ctx.fillRect(-90, -10, 180, 1);
                    ctx.fillStyle = '#3a2028';
                    ctx.fillRect(-90, 5, 180, 3);
                    ctx.fillStyle = '#15101c';
                    for (let bx = -82; bx < 86; bx += 14) ctx.fillRect(bx, -3, 2, 2);
                    ctx.restore();
                } else if (!eng.getFlag('korvak_left')) {
                    eng.drawContactShadow(ctx, 153, 343, 1, { rx: 16, ry: 4, alpha: 0.28 });
                    drawVgaPerson(ctx, 153, 342, 1.75, Object.assign({}, CIV_KORVAK, {
                        nearArm: { side: 1, up: 0.28, lo: 0.7 }
                    }));
                }
            });
        },
        draw: (ctx, w, h, eng) => {
            // Sierra pseudo-3D shell. Emergency lighting is warm here, matching
            // the room description; the reactor stays the one cool accent.
            const BW_L = 140, BW_R = 500, BW_T = 44, BW_B = 262, EDGE = 300;
            const lTop = (x) => x * (BW_T / BW_L);
            const lBot = (x) => EDGE - x * ((EDGE - BW_B) / BW_L);
            const rTop = (x) => (w - x) * (BW_T / (w - BW_R));
            const rBot = (x) => EDGE - (w - x) * ((EDGE - BW_B) / (w - BW_R));
            const lBand = (x, f) => lTop(x) + (lBot(x) - lTop(x)) * f;
            const rBand = (x, f) => rTop(x) + (rBot(x) - rTop(x)) * f;
            const trap = (x1, x2, f1, f2, band) => {
                ctx.beginPath();
                ctx.moveTo(x1, band(x1, f1)); ctx.lineTo(x2, band(x2, f1));
                ctx.lineTo(x2, band(x2, f2)); ctx.lineTo(x1, band(x1, f2));
                ctx.closePath();
            };

            ctx.fillStyle = '#120a09';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#1c0f0d';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_R, BW_T); ctx.lineTo(w, 0);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#3a201c';
            ctx.fillRect(BW_L, BW_T, BW_R - BW_L, BW_B - BW_T);
            ditherRect(ctx, BW_L, BW_T, BW_R - BW_L, 26, '#2c1714', '#4a2a24', 4);
            ctx.fillStyle = '#2e1917';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_L, BW_B); ctx.lineTo(0, EDGE);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#281512';
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(BW_R, BW_T); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#2a1f22';
            ctx.beginPath();
            ctx.moveTo(0, EDGE); ctx.lineTo(BW_L, BW_B); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#332528';
            ctx.beginPath();
            ctx.moveTo(BW_L + 40, BW_B); ctx.lineTo(BW_R - 40, BW_B); ctx.lineTo(w - 60, h); ctx.lineTo(60, h);
            ctx.closePath(); ctx.fill();
            // Tonal deck bands imply depth without visible perspective-grid lines.
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, EDGE); ctx.lineTo(BW_L, BW_B); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath(); ctx.clip();
            [['#38282c', 262, 24], ['#332429', 286, 34], ['#2d2025', 320, 38], ['#271c22', 358, 42]]
                .forEach(([color, bandY, bandH]) => {
                    ctx.fillStyle = color;
                    ctx.fillRect(0, bandY, w, bandH);
                });
            ditherRect(ctx, 0, 282, w, 8, '#38282c', '#332429', 4);
            ditherRect(ctx, 0, 316, w, 8, '#332429', '#2d2025', 4);
            ditherRect(ctx, 0, 354, w, 8, '#2d2025', '#271c22', 4);
            ctx.restore();
            ctx.strokeStyle = '#4a2a26'; ctx.lineWidth = 1;
            [36, 80, 122].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, lTop(x) + 5); ctx.lineTo(x, lBot(x) - 5); ctx.stroke(); });
            [524, 566, 606].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, rTop(x) + 5); ctx.lineTo(x, rBot(x) - 5); ctx.stroke(); });

            // Overhead pipe runs racing back toward the vanishing point.
            [[40, 190], [320, 320], [600, 450]].forEach(([nx, fx]) => {
                ctx.fillStyle = '#180e12';
                ctx.beginPath();
                ctx.moveTo(nx - 9, 0); ctx.lineTo(nx + 9, 0);
                ctx.lineTo(fx + 3, BW_T); ctx.lineTo(fx - 3, BW_T);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#4d3740';
                ctx.beginPath();
                ctx.moveTo(nx - 7, 0); ctx.lineTo(nx + 7, 0);
                ctx.lineTo(fx + 2, BW_T); ctx.lineTo(fx - 2, BW_T);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#6e5460';
                ctx.beginPath();
                ctx.moveTo(nx - 7, 0); ctx.lineTo(nx - 3, 0);
                ctx.lineTo(fx - 1, BW_T); ctx.lineTo(fx - 2, BW_T);
                ctx.closePath(); ctx.fill();
            });

            // Service pipe runs along both side walls, thinning with distance.
            const wallPipe = (band, xNear, xFar, f, body, lit) => {
                const yN = band(xNear, f), yF = band(xFar, f);
                ctx.fillStyle = body;
                ctx.beginPath();
                ctx.moveTo(xNear, yN - 6); ctx.lineTo(xFar, yF - 2.5);
                ctx.lineTo(xFar, yF + 2.5); ctx.lineTo(xNear, yN + 6);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = lit;
                ctx.beginPath();
                ctx.moveTo(xNear, yN - 6); ctx.lineTo(xFar, yF - 2.5);
                ctx.lineTo(xFar, yF - 1.5); ctx.lineTo(xNear, yN - 3);
                ctx.closePath(); ctx.fill();
            };
            wallPipe(lBand, 0, BW_L, 0.12, '#3a2a2e', '#5f4752');
            wallPipe(lBand, 0, BW_L, 0.22, '#32242a', '#54404a');
            wallPipe(rBand, w, BW_R, 0.12, '#3a2a2e', '#5f4752');
            wallPipe(rBand, w, BW_R, 0.22, '#32242a', '#54404a');
            // Coolant valve manifold on the left wall
            const valveY = lBand(102, 0.36);
            ctx.fillStyle = '#1a1016';
            ctx.fillRect(96, valveY - 16, 13, 32);
            ctx.fillStyle = '#4a3a42';
            ctx.fillRect(98, valveY - 14, 9, 28);
            ctx.strokeStyle = '#7a6270'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(102, valveY, 11, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(91, valveY); ctx.lineTo(113, valveY);
            ctx.moveTo(102, valveY - 11); ctx.lineTo(102, valveY + 11);
            ctx.stroke(); ctx.lineWidth = 1;
            // Sickly red emergency wash
            ctx.fillStyle = 'rgba(150,30,20,0.10)';
            ctx.fillRect(0, 17, w, h - 17);
            alarmGlow(ctx, w, h, eng);

            // Back-wall plant: ducting overhead and a bank of pump housings at
            // deck level, so the room reads as machinery rather than bare wall.
            const rFlicker = 0.6 + Math.sin(eng.animTimer / 90) * 0.4;
            [[148, 286], [354, 492]].forEach(([dx0, dx1]) => {
                ctx.fillStyle = '#150d11'; ctx.fillRect(dx0, 44, dx1 - dx0, 28);
                ctx.fillStyle = '#42353f'; ctx.fillRect(dx0 + 2, 46, dx1 - dx0 - 4, 24);
                ctx.fillStyle = '#584857'; ctx.fillRect(dx0 + 2, 46, dx1 - dx0 - 4, 3);
                ctx.fillStyle = '#241b28';
                for (let sx = dx0 + 10; sx < dx1 - 6; sx += 26) ctx.fillRect(sx, 46, 3, 24);
            });
            const pumpUnit = (bx, by, bw, bh) => {
                ctx.fillStyle = '#150d11'; ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
                ctx.fillStyle = '#3b3040'; ctx.fillRect(bx, by, bw, bh);
                ctx.fillStyle = '#4e4155'; ctx.fillRect(bx, by, bw, 4);
                ctx.fillStyle = '#241b28'; ctx.fillRect(bx, by + bh - 6, bw, 6);
                for (let rx = bx + 7; rx < bx + bw - 5; rx += 11) ctx.fillRect(rx, by + 7, 3, bh - 16);
                ctx.fillStyle = '#0d0a10';
                ctx.beginPath(); ctx.arc(bx + bw - 13, by + 14, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#8c3a24';
                ctx.beginPath(); ctx.arc(bx + bw - 13, by + 14, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#f2c7a0';
                ctx.fillRect(bx + bw - 14, by + 10, 1, 5);
            };
            pumpUnit(150, 196, 80, 62);
            pumpUnit(240, 212, 46, 46);
            pumpUnit(354, 212, 46, 46);
            pumpUnit(410, 196, 80, 62);
            // Cable bundles draped between the console bank and the pumps
            ctx.strokeStyle = '#1d141c'; ctx.lineWidth = 4;
            [[150, 176, 232, 188], [408, 188, 490, 176]].forEach(([cx0, cy0, cx1, cy1]) => {
                ctx.beginPath();
                ctx.moveTo(cx0, cy0);
                ctx.quadraticCurveTo((cx0 + cx1) / 2, cy0 + 16, cx1, cy1);
                ctx.stroke();
            });
            ctx.strokeStyle = '#40303c'; ctx.lineWidth = 2;
            [[150, 174, 232, 186], [408, 186, 490, 174]].forEach(([cx0, cy0, cx1, cy1]) => {
                ctx.beginPath();
                ctx.moveTo(cx0, cy0);
                ctx.quadraticCurveTo((cx0 + cx1) / 2, cy0 + 16, cx1, cy1);
                ctx.stroke();
            });
            ctx.lineWidth = 1;
            // Floor vents at the base of each side wall, backlit by the fires below
            const vent = (vx0, vx1, vy0, vy1) => {
                ctx.fillStyle = '#120b0f';
                ctx.beginPath();
                ctx.moveTo(vx0, vy0); ctx.lineTo(vx1, vy1);
                ctx.lineTo(vx1, vy1 + 18); ctx.lineTo(vx0, vy0 + 26);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = 'rgba(220,90,40,0.30)';
                ctx.beginPath();
                ctx.moveTo(vx0 + 3, vy0 + 4); ctx.lineTo(vx1 - 2, vy1 + 3);
                ctx.lineTo(vx1 - 2, vy1 + 15); ctx.lineTo(vx0 + 3, vy0 + 22);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#241b28';
                for (let i = 0; i < 5; i++) {
                    const t = i / 4;
                    const bx = vx0 + (vx1 - vx0) * t;
                    const by = vy0 + (vy1 - vy0) * t;
                    ctx.fillRect(bx, by + 2, 3, 22 - t * 8);
                }
            };
            vent(28, 108, 268, 246);
            vent(612, 532, 268, 246);

            // Reactor: a cylindrical containment stack, banded and caged. Its
            // core window is the one cool light source in a warm, dying room.
            ctx.fillStyle = '#0d0a12';
            ctx.fillRect(281, 30, 78, 258);
            [['#241e2e', 283, 74], ['#302940', 288, 62], ['#3d3450', 294, 48],
             ['#4a4060', 301, 32], ['#5a4e72', 306, 18], ['#6d6086', 310, 8]]
                .forEach(([c, bx, bw]) => { ctx.fillStyle = c; ctx.fillRect(bx, 32, bw, 254); });
            // Coolant lines leaving the stack and dropping to the pump bank
            const coolantRun = (hx0, hx1, vx) => {
                ctx.fillStyle = '#150d11';
                ctx.fillRect(hx0, 100, hx1 - hx0, 15);
                ctx.fillRect(vx, 100, 15, 108);
                ctx.fillStyle = '#4b4159';
                ctx.fillRect(hx0, 102, hx1 - hx0, 11);
                ctx.fillRect(vx + 2, 102, 11, 104);
                ctx.fillStyle = '#6d6086';
                ctx.fillRect(hx0, 102, hx1 - hx0, 2);
                ctx.fillRect(vx + 2, 102, 3, 104);
            };
            coolantRun(246, 288, 246);
            coolantRun(352, 394, 379);
            // Containment rings
            [90, 136, 212, 250].forEach((ry) => {
                ctx.fillStyle = '#0d0a12'; ctx.fillRect(279, ry, 82, 12);
                ctx.fillStyle = '#4b4159'; ctx.fillRect(281, ry + 1, 78, 10);
                ctx.fillStyle = '#6d6086'; ctx.fillRect(281, ry + 1, 78, 2);
                ctx.fillStyle = '#1a1424';
                for (let bx = 286; bx < 358; bx += 12) ctx.fillRect(bx, ry + 4, 3, 5);
            });
            // Core viewport behind a cage grille
            ctx.fillStyle = '#08131c'; ctx.fillRect(290, 152, 60, 58);
            ctx.fillStyle = 'rgba(40,150,220,' + (rFlicker * 0.5) + ')';
            ctx.fillRect(292, 154, 56, 54);
            ctx.fillStyle = 'rgba(120,220,255,' + (rFlicker * 0.6) + ')';
            ctx.beginPath(); ctx.arc(320, 181, 21, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(200,245,255,' + (rFlicker * 0.85) + ')';
            ctx.beginPath(); ctx.arc(320, 181, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#EAFBFF';
            ctx.beginPath(); ctx.arc(320, 181, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a1424';
            for (let gx = 296; gx < 348; gx += 10) ctx.fillRect(gx, 152, 3, 58);
            ctx.fillRect(290, 179, 60, 3);
            // Hazard stripes and plinth at the base
            for (let i = 0; i * 10 < 78; i++) {
                ctx.fillStyle = i % 2 ? '#c8a416' : '#1b1b28';
                ctx.fillRect(281 + i * 10, 264, 10, 8);
            }
            ctx.fillStyle = '#0d0a12'; ctx.fillRect(275, 272, 90, 16);
            ctx.fillStyle = '#3b3040'; ctx.fillRect(277, 274, 86, 12);
            ctx.fillStyle = '#4e4155'; ctx.fillRect(277, 274, 86, 3);
            // Core light spilling onto the deck
            ctx.fillStyle = 'rgba(90,200,255,' + (rFlicker * 0.09) + ')';
            ctx.beginPath(); ctx.ellipse(320, 296, 104, 26, 0, 0, Math.PI * 2); ctx.fill();
            // Stencilled markings
            ctx.textAlign = 'center';
            ctx.fillStyle = '#9c8fae';
            ctx.font = '8px "Courier New"';
            ctx.fillText('REACTOR', 320, 118);
            ctx.fillText('CORE', 320, 128);
            ctx.fillStyle = '#c8a416';
            ctx.fillText('DANGER', 320, 238);
            ctx.textAlign = 'left';

            // Left bank of consoles
            drawComputerTerminal(ctx, 156, 96, 90, 70,
                [
                    { text: 'CORE TEMP: 8420K', color: '#FF4444' },
                    { text: 'FIELD: OFFLINE', color: '#FF8800' },
                    { text: 'COOLING: FAIL', color: '#FF4444' }
                ], true);
            alarmLight(ctx, 190, 82, eng);

            // Right console bank
            drawComputerTerminal(ctx, 394, 96, 90, 70,
                [
                    { text: 'PWR OUTPUT: 12%', color: '#FFAA44' },
                    { text: 'LIFE SUPPORT: OK', color: '#33AA55' },
                    { text: 'HULL: BREACH D7', color: '#FF4444' }
                ], true);
            alarmLight(ctx, 428, 82, eng);

            // Collapsed beam across floor (wreckage). Shaded as a solid I-beam
            // rather than a flat slab, which previously read as a hole in the art.
            ctx.fillStyle = 'rgba(10,6,14,0.5)';
            ctx.beginPath(); ctx.ellipse(316, 322, 96, 11, -0.08, 0, Math.PI * 2); ctx.fill();
            ctx.save();
            ctx.translate(320, 310);
            ctx.rotate(-0.1);
            // Web and lower flange in shadow
            ctx.fillStyle = '#241c2e';
            ctx.fillRect(-90, -8, 180, 16);
            ctx.fillStyle = '#4a3f56';
            ctx.fillRect(-90, -8, 180, 4);
            // Top flange catches the emergency lighting
            ctx.fillStyle = '#6d5f7c';
            ctx.fillRect(-90, -10, 180, 3);
            ctx.fillStyle = '#8f7fa2';
            ctx.fillRect(-90, -10, 180, 1);
            // Lower edge picks up the fire glow bouncing off the deck
            ctx.fillStyle = '#3a2028';
            ctx.fillRect(-90, 5, 180, 3);
            // Rivet line and stress buckles
            ctx.fillStyle = '#15101c';
            for (let bx = -82; bx < 86; bx += 14) ctx.fillRect(bx, -3, 2, 2);
            ctx.fillStyle = '#2f2640';
            ctx.fillRect(-24, -8, 3, 16);
            ctx.fillRect(38, -8, 3, 16);
            // Sheared ends, torn rather than cut
            ctx.fillStyle = '#5a4d68';
            ctx.beginPath();
            ctx.moveTo(90, -10); ctx.lineTo(97, -4); ctx.lineTo(92, 2); ctx.lineTo(96, 8); ctx.lineTo(90, 8);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-90, -10); ctx.lineTo(-97, -5); ctx.lineTo(-93, 1); ctx.lineTo(-98, 8); ctx.lineTo(-90, 8);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            // Conduit pipe damage on the right wall
            ctx.fillStyle = '#334455';
            trap(506, 522, 0.28, 0.82, rBand); ctx.fill();
            ctx.fillStyle = '#1a1a28';
            trap(508, 520, 0.58, 0.70, rBand); ctx.fill();

            // Fire damage — blown conduit on the right wall
            if (!eng.getFlag('fire_suppressed')) {
                drawFireEffect(ctx, 516, 226, 18, 0.85, eng.animTimer);
                drawSmokeWisp(ctx, 516, 214, 80, eng.animTimer);
                drawFireEffect(ctx, 498, 240, 10, 0.7, eng.animTimer + 200);
            } else {
                ctx.fillStyle = '#1a0808';
                ctx.beginPath(); ctx.ellipse(512, 234, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
            }

            // Fire suppression cabinet on the left wall
            ctx.fillStyle = '#AA2222';
            trap(24, 84, 0.46, 0.84, lBand); ctx.fill();
            ctx.fillStyle = '#CC3333';
            trap(28, 80, 0.48, 0.82, lBand); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '8px "Courier New"';
            ctx.fillText('FIRE', 40, 176);
            ctx.fillText('SUPP', 40, 186);
            // Cabinet lock
            ctx.fillStyle = eng.getFlag('cabinet_opened') ? '#225522' : '#AA5500';
            ctx.fillRect(50, 196, 8, 12);

            // Door back to corridor (right wall)
            ctx.fillStyle = '#1a2630';
            trap(556, 628, 0.20, 0.86, rBand); ctx.fill();
            ctx.fillStyle = '#335566';
            trap(560, 624, 0.22, 0.84, rBand); ctx.fill();
            ctx.fillStyle = '#0e161c';
            trap(590, 594, 0.22, 0.84, rBand); ctx.fill();
            ctx.fillStyle = '#AABBCC';
            ctx.font = '8px "Courier New"';
            ctx.fillText('CORRIDOR', 566, 160);

            // Medkit gleam in cabinet if available
            if (!eng.getFlag('got_medkit') && eng.getFlag('cabinet_opened')) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(36, 212, 24, 16);
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(44, 215, 8, 10);
                ctx.fillStyle = '#FF4444';
                ctx.fillRect(40, 218, 16, 4);
            } else if (eng.getFlag('cabinet_opened') && !eng.getFlag('fire_suppressed')) {
                ctx.fillStyle = '#CCCCDD';
                ctx.fillRect(42, 262, 20, 14);
                ctx.fillStyle = '#77AAFF';
                ctx.fillRect(46, 265, 12, 8);
            }

            // Room label
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#556677';
            ctx.fillText('ENGINE ROOM - DECK 3', 10, 395);
        },
        hotspots: [
            {
                name: 'Reactor Core',
                x: 285, y: 80, w: 70, h: 210,
                description: 'The ship\'s main reactor. Emergency containment is holding, but barely. The blue glow pulses erratically.',
                look: (e) => e.showMessage('The reactor core hums ominously. Containment fields are wavering. One more power surge and it\'ll be lights-out for good.'),
                use: (e) => {
                    if (!e.getFlag('warn_reactor')) {
                        e.setFlag('warn_reactor');
                        e.showMessage('You\'d need a death wish — and a radiation suit — to mess with the reactor directly. Probably best not to touch it a second time.');
                    } else {
                        e.die('You decide to "just check something" on the reactor. The containment field, already questionable, objects strenuously to your presence. You now emit a gentle cyan glow. Posthumously. Your atoms are doing fine, individually. As a janitor, you are less well.');
                    }
                },
                get: (e) => e.die('You reach to take a souvenir chunk of the reactor. This is the last decision you ever make. Your family will be proud. They will also be unable to hold a funeral without a lead-lined box.'),
                useItem: (e) => e.showMessage('That won\'t help with a reactor meltdown.')
            },
            {
                name: 'Left Console',
                x: 152, y: 92, w: 98, h: 78,
                description: 'A navigation and systems monitoring console. Status indicators glow red across the board.',
                look: (e) => e.showMessage('The console shows critical failures across half the ship\'s systems. Core temperature is off the charts.'),
                use: (e) => e.showMessage('You tap a few keys but the input subsystem is unresponsive. The main I/O bus must be offline.')
            },
            {
                name: 'Korvak',
                x: 215, y: 288, w: 62, h: 74,
                get hidden() { return engine.getFlag('korvak_left'); },
                description: 'A man is pinned under a collapsed support beam.',
                look: (e) => {
                    if (e.getFlag('korvak_freed')) {
                        e.showMessage('Korvak leans against the wall, breathing hard. He looks relieved but still in pain. The plasma cutter rests beside him.');
                    } else {
                        if (!e.getFlag('looked_korvak')) { e.setFlag('looked_korvak'); e.addScore(2); }
                        e.showMessage('A man in a chief engineer\'s uniform is trapped under a heavy beam. He\'s conscious — barely. His leg is badly mangled.');
                    }
                },
                talk: (e) => e.startDialog('korvak'),
                useItem: (e, id) => {
                    if (id === 'medkit' && !e.getFlag('korvak_freed')) {
                        e.removeFromInventory('medkit');
                        e.setFlag('korvak_freed');
                        e.setFlag('korvak_left');
                        e.addScore(20);
                        // Award cutter only if Korvak hasn't already given it via dialog
                        if (!e.getFlag('korvak_gave_cutter')) {
                            e.addToInventory('plasma_cutter');
                            e.setFlag('korvak_gave_cutter');
                        }
                        e.showMessage('You use the medkit to stabilize Korvak\'s wounds. He grits his teeth as you patch him up, then helps you lever the beam aside. "Thank you," he rasps. He hands you a battered plasma cutter from his belt.');
                    } else if (id === 'medkit' && e.getFlag('korvak_freed')) {
                        e.showMessage('Korvak is already patched up as best as possible.');
                    } else {
                        e.showMessage('Moving the beam now would make you less rescuer and more accomplice.');
                    }
                }
            },
            {
                name: 'Collapsed Beam',
                x: 240, y: 292, w: 160, h: 28,
                description: 'A massive structural beam has collapsed across the floor.',
                look: (e) => e.showMessage('The beam fell during the Draknoid attack. It weighs a tonne. There\'s a man pinned under the left end.'),
                use: (e) => {
                    if (!e.getFlag('korvak_freed')) {
                        e.showMessage('The beam refuses to budge. Korvak looks breakable enough already.');
                    } else {
                        e.showMessage('The beam has already been levered aside.');
                    }
                }
            },
            {
                name: 'Fire Suppression Cabinet',
                x: 22, y: 136, w: 64, h: 114,
                get hidden() { return engine.getFlag('got_medkit') && engine.getFlag('fire_suppressed'); },
                description: 'A red fire suppression cabinet bolted to the left wall.',
                look: (e) => {
                    if (e.getFlag('cabinet_opened') && !e.getFlag('got_medkit')) {
                        e.showMessage('The cabinet door hangs open. A medkit is inside — standard emergency kit.');
                    } else if (e.getFlag('cabinet_opened') && !e.getFlag('fire_suppressed')) {
                        e.showMessage('The cabinet door hangs open. The medkit slot is empty, but the fire suppression canister is still clipped inside.');
                    } else if (e.getFlag('cabinet_opened')) {
                        e.showMessage('The cabinet hangs open and empty. It has contributed more to this emergency than several crew meetings ever did.');
                    } else {
                        e.showMessage('A fire suppression cabinet. It\'s locked with an emergency seal — a security measure against unauthorised access during drills.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('cabinet_opened')) {
                        e.setFlag('cabinet_opened');
                        e.addScore(5);
                        e.showMessage('You find the emergency override switch behind a small panel. A click, and the cabinet door swings open. Inside: a medkit and a fire suppression canister.');
                    } else if (!e.getFlag('got_medkit')) {
                        e.showMessage('The medkit is sitting right there. Use GET to pick it up.');
                    } else if (!e.getFlag('fire_suppressed')) {
                        e.showMessage('The medkit slot is empty. The suppression canister is still ready for the conduit fire.');
                    } else {
                        e.showMessage('The cabinet is empty now. Against all odds, it did its job.');
                    }
                },
                get: (e) => {
                    if (e.getFlag('cabinet_opened') && !e.getFlag('got_medkit')) {
                        e.setFlag('got_medkit');
                        if (e.hasItem('medkit')) {
                            e.showMessage('You already have a medkit, so you leave this spare for whoever survives your next idea. The suppression canister remains clipped inside.');
                        } else {
                            e.addToInventory('medkit');
                            e.showMessage('You grab the medkit.');
                        }
                    } else if (!e.getFlag('cabinet_opened')) {
                        e.showMessage('The cabinet is locked. Find a way to open it first.');
                    } else if (!e.getFlag('fire_suppressed')) {
                        e.showMessage('The medkit is gone. The suppression canister is fixed in place until you use it on the fire.');
                    } else {
                        e.showMessage('The cabinet is empty.');
                    }
                },
                useItem: (e, id) => {
                    if (id === 'plasma_cutter' && !e.getFlag('cabinet_opened')) {
                        // Plasma cutter slices the seal
                        e.setFlag('cabinet_opened');
                        e.addScore(5);
                        e.showMessage('You slice through the cabinet seal with the plasma cutter. The door swings open: a medkit and a suppression canister inside.');
                    } else if (id === 'plasma_cutter' && e.getFlag('cabinet_opened') && !e.getFlag('fire_suppressed')) {
                        douseConduitFire(e);
                    } else if (e.getFlag('cabinet_opened') && e.getFlag('fire_suppressed')) {
                        e.showMessage('The cabinet is already open and the fire is already out. This is what success looks like, apparently.');
                    } else {
                        e.showMessage('That won\'t open a locked cabinet.');
                    }
                }
            },
            {
                name: 'Conduit Fire',
                x: 490, y: 204, w: 46, h: 50,
                get hidden() { return engine.getFlag('fire_suppressed'); },
                description: 'A ruptured conduit burning on the right wall.',
                look: (e) => e.showMessage('A ruptured conduit is burning steadily, throwing sparks across the deck plating. It is not spreading yet, but "yet" is doing a great deal of work in that sentence.'),
                get: (e) => e.showMessage('Picking up a live electrical fire is the sort of decision that ends careers and lives, in that order.'),
                use: (e) => {
                    if (!e.getFlag('cabinet_opened')) {
                        e.showMessage('You have nothing to smother it with. That red suppression cabinet on the other wall would be the obvious place to look.');
                    } else {
                        douseConduitFire(e);
                    }
                },
                talk: (e) => e.showMessage('"Nothing to see here," you tell the fire. The fire disagrees, loudly.'),
                useItem: (e, id) => {
                    if (id === 'plasma_cutter') {
                        e.showMessage('Introducing a cutting torch to an existing fire is a bold firefighting philosophy. You reconsider.');
                    } else if (!e.getFlag('cabinet_opened')) {
                        e.showMessage('That will not put out an electrical fire. You need proper suppression gear.');
                    } else {
                        douseConduitFire(e);
                    }
                }
            },
            {
                name: 'Right Console',
                x: 390, y: 92, w: 98, h: 78,
                description: 'Engineering status console.',
                look: (e) => e.showMessage('This console monitors power distribution. According to these readings, life support is the only system drawing full power. Everything else is rerouted or offline.')
            },
            {
                name: 'Corridor Exit',
                x: 554, y: 60, w: 78, h: 198, isExit: true, walkToX: 556, walkToY: 340,
                description: 'The corridor back to the main ship.',
                look: (e) => e.showMessage('The hatch back to the main corridor.'),
                onExit: (e) => e.goToRoom('corridor', 120, 310)
            }
        ]
    });

});
