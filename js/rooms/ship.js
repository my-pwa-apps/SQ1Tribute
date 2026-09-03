// ============================================================
// STAR SWEEPER - ISS CONSTELLATION (closet, corridor, science lab, pod bay)
// ============================================================

StarSweeper.defineRooms((engine) => {
    // ========== ROOM 1: BROOM CLOSET ==========
    engine.registerRoom({
        id: 'broom_closet',
        hint: 'You are locked in. Look around for something long and rigid you can use as a lever on the door.',
        name: 'Broom Closet',
        description: 'You wake up groggy in the ship\'s broom closet — your favorite napping spot, and, until recently, your finest idea. Alarms wail. Red lights flash. Something terrible has happened aboard the ISS Constellation. Typical Monday.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            e.setFlag('alarm_active');
            // Sierra pseudo-3D: floor runs 275..400, so scale gently across it.
            e.setDepthScaling(282, 378, 0.85, 1.0);
            e.setWalkableArea((x, y) => {
                if (y < 275 || y > 400) return false;
                const depth = (y - 275) / 125;
                const leftEdge = 220 * (1 - depth);
                const rightEdge = 420 + 220 * depth;
                return x >= leftEdge && x <= rightEdge;
            });
            // AGI-inspired barriers: shelves, mop bucket, door area
            e.addBarrier(25, 280, 195, 10);   // Lower shelf base blocks walking through it
            e.addBarrier(465, 306, 65, 22);    // Mop bucket
            e.addBarrier(345, 305, 35, 25);    // Floor drain

            // Foreground layer: bucket rim draws over player when walking behind it
            e.addForegroundLayer(319, (ctx) => {
                // Bucket front rim (draws over player walking behind bucket)
                ctx.fillStyle = '#404855';
                ctx.fillRect(474, 299, 46, 3);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Perspective shell: the closet is cramped, but still belongs to the
            // same pseudo-3D ship as the corridor beyond it.
            ctx.fillStyle = '#262638';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(420, 52); ctx.lineTo(220, 52);
            ctx.closePath(); ctx.fill();
            metalWall(ctx, 220, 52, 200, 223, '#38384e', '#3e3e58');
            ctx.fillStyle = '#303044';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(220, 52); ctx.lineTo(220, 275); ctx.lineTo(0, h);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#343448';
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(420, 52); ctx.lineTo(420, 275); ctx.lineTo(w, h);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#35354b';
            ctx.beginPath();
            ctx.moveTo(220, 275); ctx.lineTo(420, 275); ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath(); ctx.fill();

            // Perspective-correct panel seams on the side walls.
            ctx.strokeStyle = '#4a4a60';
            ctx.lineWidth = 2;
            [55, 110, 165].forEach((x) => {
                ctx.beginPath(); ctx.moveTo(x, x * 52 / 220); ctx.lineTo(x, h - x * 125 / 220); ctx.stroke();
            });
            [475, 530, 585].forEach((x) => {
                const d = w - x;
                ctx.beginPath(); ctx.moveTo(x, d * 52 / 220); ctx.lineTo(x, h - d * 125 / 220); ctx.stroke();
            });
            ctx.fillStyle = '#3d3d54';
            ctx.beginPath();
            ctx.moveTo(0, h); ctx.lineTo(220, 275); ctx.lineTo(420, 275); ctx.lineTo(w, h);
            ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#414158';
            ctx.beginPath();
            ctx.moveTo(105, 340); ctx.lineTo(535, 340); ctx.lineTo(640, 400); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();

            // Ceiling pipes
            ctx.fillStyle = '#505065';
            ctx.fillRect(0, 0, w, 8);
            ctx.fillStyle = '#5a5a70';
            ctx.fillRect(90, 4, 6, 22);
            ctx.fillRect(380, 4, 6, 22);
            ctx.fillRect(530, 4, 6, 22);

            // Wall bands: props mounted on the side walls must follow the same
            // convergence as the walls (vanishing point sits at ~497,117).
            const lTop = (x) => x * 52 / 220;
            const lBot = (x) => h - x * 125 / 220;
            const lBand = (x, f) => lTop(x) + (lBot(x) - lTop(x)) * f;
            const lSc = (x) => (lBot(x) - lTop(x)) / h;
            const rTop = (x) => (w - x) * 52 / 220;
            const rBot = (x) => h - (w - x) * 125 / 220;
            const rBand = (x, f) => rTop(x) + (rBot(x) - rTop(x)) * f;
            const rSc = (x) => (rBot(x) - rTop(x)) / h;
            const wallQuad = (x1, x2, f1, f2, band) => {
                ctx.beginPath();
                ctx.moveTo(x1, band(x1, f1)); ctx.lineTo(x2, band(x2, f1));
                ctx.lineTo(x2, band(x2, f2)); ctx.lineTo(x1, band(x1, f2));
                ctx.closePath();
            };
            /** Draw a prop standing on a wall shelf; local origin is its base. */
            const shelfProp = (x, f, drawLocal) => {
                const sc = lSc(x), base = lBand(x, f);
                const put = (dx, dy, iw, ih, colour) => {
                    ctx.fillStyle = colour;
                    const x0 = Math.round(x + dx * sc), y0 = Math.round(base + dy * sc);
                    ctx.fillRect(x0, y0, Math.round(x + (dx + iw) * sc) - x0, Math.round(base + (dy + ih) * sc) - y0);
                };
                const label = (text, dx, dy, size, colour) => {
                    ctx.fillStyle = colour;
                    ctx.font = `${Math.max(3, Math.round(size * sc))}px "Courier New"`;
                    ctx.fillText(text, Math.round(x + dx * sc), Math.round(base + dy * sc));
                };
                drawLocal(put, label);
            };
            const SHELF_HI = 0.216, SHELF_LO = 0.3925;

            // Left shelves — planks and brackets follow the wall's convergence
            [SHELF_HI, SHELF_LO].forEach((f) => {
                ctx.fillStyle = '#5a5a6e';
                ctx.beginPath();
                ctx.moveTo(25, lBand(25, f)); ctx.lineTo(215, lBand(215, f));
                ctx.lineTo(215, lBand(215, f) + 6 * lSc(215)); ctx.lineTo(25, lBand(25, f) + 6 * lSc(25));
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#4a4a5e';
                [35, 205].forEach((bx) => {
                    ctx.fillRect(bx, lBand(bx, f) + 6 * lSc(bx), Math.max(2, 4 * lSc(bx)), 25 * lSc(bx));
                });
            });

            // Astro-Shine spray bottle
            shelfProp(48, SHELF_HI, (put, label) => {
                put(0, -16, 14, 16, '#5080a0');
                put(2, -14, 10, 12, '#6090b0');
                put(4, -22, 8, 8, '#4070a0');
                put(10, -19, 6, 3, '#4070a0');
                label('A-S', 2, -6, 4, '#fff');
            });

            // Zero-G dust cloth box
            shelfProp(78, SHELF_HI, (put, label) => {
                put(0, -15, 32, 15, '#6a8858');
                put(2, -13, 28, 11, '#7a9868');
                label('DUST', 4, -7, 5, '#fff');
                label('CLOTH', 3, -2, 5, '#fff');
            });

            // Tall purple bottle (leaking!)
            shelfProp(128, SHELF_HI, (put, label) => {
                put(0, -24, 12, 24, '#7040a0');
                put(2, -22, 8, 20, '#8050b0');
                put(3, -28, 6, 4, '#604090');
                label('???', 1, -11, 4, '#ff0');
            });
            // Purple drip from bottom of bottle down shelf edge
            ctx.fillStyle = '#8050c0';
            ctx.fillRect(133, 96, 3, 6);
            ctx.fillRect(132, 101, 4, 3);
            // Purple drips down wall (slow intermittent drops, not a line)
            ctx.fillStyle = 'rgba(120,60,180,0.7)';
            // Stationary drip blobs clinging to wall at intervals
            ctx.beginPath(); ctx.ellipse(134, 112, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(133, 126, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.5)';
            ctx.beginPath(); ctx.ellipse(134, 138, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
            // Animated drip falling between shelf and lower shelf
            const wallDrip = (eng.animTimer % 3200) / 3200;
            if (wallDrip < 0.6) {
                const wd = wallDrip / 0.6;
                ctx.fillStyle = `rgba(120,60,180,${0.5 + wd * 0.2})`;
                ctx.beginPath(); ctx.ellipse(134, 102 + wd * 42, 1.5 + wd * 0.5, 2 + wd, 0, 0, Math.PI * 2); ctx.fill();
            }
            // Purple puddle on lower shelf
            ctx.fillStyle = 'rgba(110,50,170,0.5)';
            ctx.beginPath(); ctx.ellipse(134, 146, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Purple drips from lower shelf to floor (intermittent blobs)
            ctx.fillStyle = 'rgba(120,60,180,0.45)';
            ctx.beginPath(); ctx.ellipse(134, 178, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.35)';
            ctx.beginPath(); ctx.ellipse(133, 216, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(134, 254, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.25)';
            ctx.beginPath(); ctx.ellipse(133, 292, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            // Animated drip falling from lower shelf to floor
            const floorDrip = (eng.animTimer % 2800) / 2800;
            if (floorDrip < 0.7) {
                const fd = floorDrip / 0.7;
                ctx.fillStyle = `rgba(120,60,180,${0.4 + fd * 0.2})`;
                ctx.beginPath(); ctx.ellipse(134, 150 + fd * 166, 1.5 + fd * 0.5, 2 + fd, 0, 0, Math.PI * 2); ctx.fill();
            }
            // Animated falling droplet
            const dripCycle = (eng.animTimer % 2400) / 2400; // 2.4s cycle
            if (dripCycle < 0.7) {
                // Droplet forming at bottom of streak
                const formP = dripCycle / 0.7;
                if (formP > 0.6) {
                    const bulge = (formP - 0.6) / 0.4;
                    ctx.fillStyle = 'rgba(130,60,200,0.7)';
                    ctx.beginPath(); ctx.ellipse(134, 275, 2 + bulge, 2 + bulge * 1.5, 0, 0, Math.PI * 2); ctx.fill();
                }
            } else {
                // Droplet falling
                const fallP = (dripCycle - 0.7) / 0.3;
                const dropY = 316 + fallP * 8;
                const dropSize = 2.5 * (1 - fallP * 0.4);
                ctx.fillStyle = `rgba(130,60,200,${0.7 - fallP * 0.3})`;
                ctx.beginPath(); ctx.ellipse(134, dropY, dropSize * 0.7, dropSize, 0, 0, Math.PI * 2); ctx.fill();
                // Tiny splash ring at impact
                if (fallP > 0.8) {
                    const splashP = (fallP - 0.8) / 0.2;
                    ctx.strokeStyle = `rgba(140,70,210,${0.5 - splashP * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.ellipse(134, 325, 3 + splashP * 6, 1.5 + splashP * 2, 0, 0, Math.PI * 2); ctx.stroke();
                }
            }
            // Purple puddle on floor
            ctx.fillStyle = 'rgba(110,50,170,0.35)';
            ctx.beginPath(); ctx.ellipse(137, 326, 16, 5, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(130,70,200,0.2)';
            ctx.beginPath(); ctx.ellipse(141, 329, 20, 7, 0.1, 0, Math.PI * 2); ctx.fill();

            // Air freshener can
            shelfProp(170, SHELF_HI, (put, label) => {
                put(0, -18, 14, 18, '#4080a8');
                put(2, -16, 10, 14, '#50a0c0');
                put(2, -21, 10, 3, '#3070a0');
                label('AIR', 3, -9, 4, '#fff');
                label('FRSH', 1, -4, 4, '#fff');
            });

            // Bottom shelf items
            shelfProp(42, SHELF_LO, (put, label) => {
                put(0, -19, 18, 19, '#aa8844');
                put(2, -17, 14, 15, '#bb9955');
                put(5, -25, 8, 6, '#aa8844');
                label('SOAP', 2, -8, 4, '#fff');
            });

            shelfProp(78, SHELF_LO, (put) => {
                put(0, -12, 30, 12, '#8a8878');
                put(2, -15, 26, 5, '#9a9888');
                put(4, -18, 22, 5, '#7a7868');
                for (let i = 0; i < 4; i++) put(1 + i * 8, 0, 3, 2, '#aaaa98');
            });

            shelfProp(100, SHELF_LO, (put, label) => {
                put(0, -7, 12, 7, '#ddcc88');
                label('M.B.', 1, -2, 3, '#cc2222');
            });

            shelfProp(165, SHELF_LO, (put, label) => {
                put(0, -14, 20, 12, '#707070');
                put(1, -16, 18, 4, '#808080');
                label('POLSH', 1, -6, 4, '#999');
            });

            // Mop & bucket — stands on the floor, whose edge at this x is y~319
            ctx.fillStyle = '#606575';
            ctx.beginPath();
            ctx.moveTo(480, 289); ctx.lineTo(470, 319); ctx.lineTo(525, 319); ctx.lineTo(515, 289);
            ctx.closePath(); ctx.fill();
            // Gray water in bucket
            ctx.fillStyle = '#707580';
            ctx.fillRect(474, 292, 46, 12);
            ctx.fillStyle = '#656a75';
            ctx.beginPath(); ctx.ellipse(497, 292, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Bucket rim
            ctx.fillStyle = '#404855';
            ctx.fillRect(474, 299, 46, 3);
            if (!eng.getFlag('has_mop_handle')) {
                // Full mop with handle
                ctx.fillStyle = '#AA8844';
                ctx.fillRect(503, 174, 4, 145);
                ctx.fillStyle = '#CCCCAA';
                ctx.fillRect(494, 312, 22, 10);
                ctx.fillStyle = '#BBBB99';
                for (let i = 0; i < 5; i++) ctx.fillRect(496 + i * 4, 319, 2, 6);
            } else {
                // Mop head flopped on floor, handle taken
                ctx.fillStyle = '#CCCCAA';
                ctx.fillRect(485, 322, 26, 6);
                ctx.fillStyle = '#BBBB99';
                for (let i = 0; i < 6; i++) ctx.fillRect(486 + i * 4, 328, 2, 4);
                // Broken stub where handle was
                ctx.fillStyle = '#886633';
                ctx.fillRect(496, 314, 4, 8);
            }

            // Door (center), inset below the back wall's ceiling edge.
            if (eng.getFlag('closet_door_open')) {
                // Door forced open - corridor visible through gap
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(270, 60, 100, 215);
                // Red emergency glow from corridor
                ctx.fillStyle = 'rgba(180,40,40,0.25)';
                ctx.fillRect(275, 66, 90, 203);
                // Corridor floor visible
                ctx.fillStyle = '#3a3a50';
                ctx.fillRect(275, 230, 90, 39);
                // Door panels shoved aside
                ctx.fillStyle = '#4e5e72';
                ctx.fillRect(263, 60, 14, 215);
                ctx.fillStyle = '#4e5e72';
                ctx.fillRect(363, 60, 14, 215);
                // Bent frame
                ctx.fillStyle = '#3e4e62';
                ctx.fillRect(270, 60, 100, 4);
                ctx.fillRect(270, 271, 100, 4);
                // Mop handle wedged in gap
                ctx.fillStyle = '#AA8844';
                ctx.fillRect(274, 120, 4, 100);
                ctx.save();
                ctx.translate(276, 120);
                ctx.rotate(-0.15);
                ctx.fillRect(-2, 0, 4, 30);
                ctx.restore();
            } else {
                // Door closed/jammed
                ctx.fillStyle = '#4e5e72';
                ctx.fillRect(270, 60, 100, 215);
                ctx.fillStyle = '#5a6e84';
                ctx.fillRect(276, 66, 88, 203);
                ctx.fillStyle = '#3e4e62';
                ctx.fillRect(318, 66, 4, 203);
                // Handle
                ctx.fillStyle = '#CCAA22';
                ctx.fillRect(346, 155, 12, 12);
                ctx.fillStyle = '#DDBB33';
                ctx.fillRect(348, 157, 8, 8);
                // Damage/warping indicators
                ctx.fillStyle = '#3a4a5e';
                ctx.fillRect(270, 100, 3, 40);
                ctx.fillRect(367, 180, 3, 30);
                // Small gap showing jam
                ctx.fillStyle = '#1a1a2a';
                ctx.fillRect(270, 140, 2, 20);
                // Label on closed door
                ctx.font = '10px "Courier New"';
                ctx.fillStyle = '#8899AA';
                ctx.fillText('SUPPLY', 283, 118);
                ctx.fillText('CLOSET', 283, 130);
                ctx.fillText('J-6', 297, 148);
            }

            // Alarm (only when ship is under attack)
            if (eng.getFlag('alarm_active')) {
                alarmLight(ctx, 305, 18, eng);
                alarmGlow(ctx, w, h, eng);
            }

            // Interactive object indicator: subtle blinking LED on the closet door electronic lock
            if (!eng.getFlag('closet_door_open')) {
                const ledBlink = Math.floor(eng.animTimer / 250) % 2;
                ctx.fillStyle = ledBlink ? '#FF2222' : '#880000';
                ctx.fillRect(348, 157, 8, 8);
                ctx.fillStyle = ledBlink ? '#FFAAAA' : '#FF4444';
                ctx.fillRect(350, 159, 4, 4);
            }

            // Quiet floor plates preserve depth without competing with props.
            ctx.fillStyle = '#4a4a60';
            ctx.fillRect(105, 339, 430, 2);
            // Floor drain
            ctx.fillStyle = '#2a2a40';
            ctx.fillRect(350, 310, 30, 20);
            ctx.strokeStyle = '#3a3a50';
            ctx.lineWidth = 1;
            for (let dy = 0; dy < 20; dy += 4) {
                ctx.beginPath(); ctx.moveTo(352, 312 + dy); ctx.lineTo(378, 312 + dy); ctx.stroke();
            }
            // Vent grille on the right wall
            ctx.fillStyle = '#454560';
            wallQuad(430, 475, 0.175, 0.303, rBand); ctx.fill();
            ctx.fillStyle = '#3a3a55';
            for (let vf = 0.19; vf < 0.30; vf += 0.022) {
                wallQuad(432, 473, vf, vf + 0.008, rBand); ctx.fill();
            }
            // Dust particles under vent
            ctx.fillStyle = 'rgba(120,120,140,0.10)';
            wallQuad(442, 466, 0.315, 0.345, rBand); ctx.fill();

            // Safety poster on the right wall
            ctx.fillStyle = '#888855';
            wallQuad(540, 590, 0.239, 0.412, rBand); ctx.fill();
            ctx.fillStyle = '#AAAA77';
            wallQuad(543, 587, 0.247, 0.404, rBand); ctx.fill();
            {
                const pSc = rSc(565);
                const pX = 546, pTop = rBand(546, 0.247);
                const pH = rBand(546, 0.404) - pTop;
                ctx.fillStyle = '#CC2222';
                ctx.font = `${Math.round(7 * pSc)}px "Courier New"`;
                ctx.fillText('SAFETY', pX, pTop + pH * 0.20);
                ctx.fillText('FIRST!', pX + 2, pTop + pH * 0.38);
                // Stick figure on poster
                const fx = Math.round(pX + 16 * pSc), fy = pTop + pH * 0.52;
                ctx.fillStyle = '#333333';
                ctx.fillRect(fx, Math.round(fy), Math.max(1, Math.round(2 * pSc)), Math.round(12 * pSc));
                ctx.fillRect(fx - Math.round(5 * pSc), Math.round(fy + 5 * pSc), Math.round(12 * pSc), Math.max(1, Math.round(2 * pSc)));
                ctx.strokeStyle = '#333333';
                ctx.beginPath(); ctx.arc(fx + 1, Math.round(fy - 3 * pSc), Math.max(2, 3 * pSc), 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#222222';
                ctx.font = `${Math.max(4, Math.round(5 * pSc))}px "Courier New"`;
                ctx.fillText('0 DAYS', pX + 2, pTop + pH * 0.83);
                ctx.fillText('WITHOUT', pX + 1, pTop + pH * 0.92);
            }

            // Cable conduit along ceiling
            ctx.fillStyle = '#4a4a60';
            ctx.fillRect(0, 8, w, 3);
            // Cable clips
            ctx.fillStyle = '#5a5a70';
            for (let cx = 40; cx < w; cx += 60) {
                ctx.fillRect(cx, 7, 4, 5);
            }

            // Water stain on floor
            ctx.fillStyle = 'rgba(80,80,110,0.15)';
            ctx.beginPath(); ctx.ellipse(490, 340, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
        },
        hotspots: [
            {
                name: 'Door', x: 270, y: 60, w: 100, h: 215, isExit: true, walkToX: 320, walkToY: 280,
                description: 'A heavy sliding door leads to the corridor.',
                look: (e) => {
                    if (e.getFlag('closet_door_open')) {
                        e.showMessage('The door is wedged open now. The corridor beyond glows with emergency red lighting.');
                    } else {
                        e.showMessage('A reinforced sliding door. It looks jammed — the attack must have warped the frame. You\'ll need something sturdy to pry it open.');
                    }
                },
                onExit: (e) => {
                    if (e.getFlag('closet_door_open')) {
                        // Step out beside the doorway, clear of its walk-in trigger and Dr. Chen's body.
                        e.goToRoom('corridor', 270, 310);
                    } else {
                        e.showMessage('The door is jammed shut! The frame is warped from the attack. You need to find something to pry it open.');
                    }
                },
                use: (e) => {
                    if (e.getFlag('closet_door_open')) {
                        e.showMessage('The door is already open.');
                    } else if (e.hasItem('mop_handle')) {
                        engine.sound.metalScrape();
                        e.showMessage('You jam the mop handle into the gap and heave! With a metallic screech, the door grinds open just enough to squeeze through. Your janitor muscles came through!');
                        e.removeFromInventory('mop_handle');
                        e.setFlag('closet_door_open');
                        e.addScore(5);
                    } else {
                        e.showMessage('You tug on the door with your bare hands. It won\'t budge. You need something to lever it open.');
                    }
                },
                useItem: (e, itemId) => {
                    if (e.getFlag('closet_door_open')) {
                        e.showMessage('The door is already open.');
                    } else if (itemId === 'mop_handle') {
                        engine.sound.metalScrape();
                        e.showMessage('You jam the mop handle into the gap and heave! With a metallic screech, the door grinds open just enough to squeeze through. Your janitor muscles came through!');
                        e.removeFromInventory('mop_handle');
                        e.setFlag('closet_door_open');
                        e.addScore(5);
                    } else {
                        e.showMessage('That won\'t help with this door.');
                    }
                }
            },
            {
                name: 'Shelves', x: 25, y: 70, w: 195, h: 117,
                description: 'Metal shelves stacked with cleaning supplies.',
                look: (e) => e.showMessage('Rusty shelves holding assorted cleaning supplies — Astro-Shine polish, Zero-G dust cloths, a leaking bottle of something purple, and industrial-strength air freshener. Nothing useful for survival.'),
                get: (e) => e.showMessage('You rummage through the cleaning supplies. Some detergent, old rags, and a coupon for "Monolith Burger" that expired two years ago. Nothing helpful.'),
                use: (e) => e.showMessage('What are you going to do, clean up? The ship is under attack! Though you do feel a professional twinge of guilt about that purple stain...'),
                talk: (e) => e.showMessage('"Hello, cleaning supplies. It\'s me, your old friend." They do not respond. Probably for the best.')
            },
            {
                name: 'Astro-Shine Bottle', x: 46, y: 68, w: 17, h: 24,
                description: 'A spray bottle of Astro-Shine polish.',
                look: (e) => e.showMessage('"Astro-Shine All-Surface Polish — Makes Any Metal Gleam Like New!" You\'ve gone through about fifty of these. This one\'s nearly empty.'),
                get: (e) => e.showMessage('You grab the Astro-Shine bottle and give it a shake. Almost empty. Not worth the inventory space.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = engine.playerSpriteScale(py);
                    e.playCutscene({
                        duration: 1800,
                        skippable: true,
                        draw: (ctx, w, h, progress) => {
                            miniAnimRedrawRoom(ctx, w, h);
                            const armUp = progress < 0.6 ? Math.min(progress / 0.3, 1) * 0.7 : (1 - (progress - 0.6) / 0.4) * 0.7;
                            // Screen shake at 60%
                            if (progress > 0.55 && progress < 0.7) {
                                const shake = Math.sin(progress * 80) * 2;
                                ctx.save();
                                ctx.translate(shake, 0);
                                miniAnimRedrawRoom(ctx, w, h);
                                drawPlayerBody(ctx, px, py, sc, 0.3);
                                ctx.restore();
                            } else {
                                drawPlayerBody(ctx, px, py, sc, armUp);
                            }
                            // Spray particles
                            if (progress > 0.2 && progress < 0.7) {
                                const sp = (progress - 0.2) / 0.5;
                                for (let i = 0; i < 6; i++) {
                                    const sx = px + 8 * sc + sp * (15 + i * 5);
                                    const sy = py - 6 * sc + Math.sin(i * 2 + sp * 8) * 4;
                                    const alpha = 0.6 * (1 - sp);
                                    ctx.fillStyle = `rgba(80,160,200,${alpha})`;
                                    ctx.beginPath();
                                    ctx.arc(sx, sy, 1.5 - sp * 0.5, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                            }
                        },
                        onEnd: () => {
                            engine.playerX = px;
                            engine.playerY = py;
                            e.showMessage('You instinctively point the nozzle at the nearest surface and give it a spritz. Old habits. The ship shudders from another explosion. Right. Not the time.');
                        }
                    });
                }
            },
            {
                name: 'Zero-G Dust Cloths', x: 76, y: 77, w: 31, h: 17,
                description: 'A box of Zero-G dust cloths.',
                look: (e) => e.showMessage('"Zero-G Dust Cloths — For When Dust Doesn\'t Settle!" Specially designed for cleaning in artificial gravity environments. The box is half empty.'),
                get: (e) => e.showMessage('You pull out a dust cloth. It\'s just a cloth. You put it back.'),
                use: (e) => e.showMessage('You wipe down the nearest surface with a cloth. Habit. The ship lurches violently. Okay, enough cleaning.')
            },
            {
                name: 'Purple Bottle', x: 126, y: 72, w: 13, h: 25,
                description: 'A tall bottle of mysterious purple liquid.',
                look: (e) => e.showMessage('A tall bottle labeled only "???" in yellow marker. It glows faintly and has ignored three maintenance reports.'),
                get: (e) => e.showMessage('Your fingers tingle before you even touch it. Some mysteries are best left shelved.'),
                use: (e) => e.showMessage('You tighten the cap. Purple liquid immediately begins seeping through the threads. This bottle does not respect the laws of fluid dynamics.')
            },
            {
                name: 'Air Freshener', x: 168, y: 81, w: 13, h: 18,
                description: 'A can of industrial air freshener.',
                look: (e) => e.showMessage('"FreshAir Industrial Odor Neutralizer — Starship Strength." The can is nearly empty, like your will to live.'),
                get: (e) => e.showMessage('You pick it up and shake it. Barely a rattle. Even at full capacity it couldn\'t mask what\'s happening to this ship right now.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = engine.playerSpriteScale(py);
                    e.playCutscene({
                        duration: 2000,
                        skippable: true,
                        draw: (ctx, w, h, progress) => {
                            miniAnimRedrawRoom(ctx, w, h);
                            // Arm raises to spray
                            const armUp = progress < 0.3 ? progress / 0.3 : (progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1);
                            drawPlayerBody(ctx, px, py, sc, armUp * 0.5);
                            // Spray cloud expanding
                            if (progress > 0.25 && progress < 0.85) {
                                const cp = (progress - 0.25) / 0.6;
                                const cloudR = cp * 35;
                                const alpha = 0.25 * (1 - cp);
                                ctx.fillStyle = `rgba(180,220,240,${alpha})`;
                                ctx.beginPath();
                                ctx.arc(px, py - 12 * sc, cloudR, 0, Math.PI * 2);
                                ctx.fill();
                                // Smaller puffs
                                ctx.fillStyle = `rgba(200,240,255,${alpha * 0.7})`;
                                ctx.beginPath();
                                ctx.arc(px - 15 + cp * 10, py - 8 * sc, cloudR * 0.5, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.beginPath();
                                ctx.arc(px + 15 - cp * 10, py - 14 * sc, cloudR * 0.4, 0, Math.PI * 2);
                                ctx.fill();
                                // "Psssht" text
                                if (cp < 0.4) {
                                    ctx.fillStyle = `rgba(255,255,255,${0.8 - cp * 2})`;
                                    ctx.font = `${10 + cp * 8}px "Courier New"`;
                                    ctx.textAlign = 'center';
                                    ctx.fillText('Psssht!', px, py - 20 * sc - cp * 15);
                                    ctx.textAlign = 'left';
                                }
                            }
                        },
                        onEnd: () => {
                            engine.playerX = px;
                            engine.playerY = py;
                            e.showMessage('Psssht! A tiny burst of "Ocean Breeze" scent fills the closet. For one brief moment, you forget you\'re on an exploding spaceship. Then you remember.');
                        }
                    });
                }
            },
            {
                name: 'Detergent Jug', x: 40, y: 129, w: 20, h: 27,
                description: 'A jug of industrial detergent.',
                look: (e) => e.showMessage('"SoapMaster 3000 — Cuts Through Grease and Alien Residue!" About a quarter full. The label claims it\'s lemon-scented but it smells more like a chemical plant on fire.'),
                get: (e) => e.showMessage('It\'s heavy and sloshy. You\'d rather not lug a jug of detergent around while fleeing for your life.'),
                use: (e) => e.showMessage('You consider pouring some on the purple puddle. Then again, mixing unknown chemicals with mysterious alien goo seems like a bad idea. Even for you.')
            },
            {
                name: 'Stack of Rags', x: 76, y: 134, w: 29, h: 19,
                description: 'A pile of worn cleaning rags.',
                look: (e) => e.showMessage('A stack of well-used cleaning rags in various states of decay. Some are stiff with dried polish, others are suspiciously stained. A coupon for Monolith Burger is sticking out — expired two years ago.'),
                get: (e) => e.showMessage('You grab a rag, then put it back. What are you going to do, wipe your way to safety?'),
                use: (e) => e.showMessage('You absentmindedly fold the top rag. Neat edges. There. At least SOMETHING on this ship is in order.')
            },
            {
                name: 'Polish Tin', x: 163, y: 131, w: 17, h: 15,
                description: 'A tin of metal polish.',
                look: (e) => e.showMessage('An old tin of "Star-Brite Metal Polish." The lid is rusted shut, which is ironic for a product that\'s supposed to prevent rust. It\'s been here since before you started this job.'),
                get: (e) => e.showMessage('The tin is stuck to the shelf. Literally. Something has glued it in place. Probably that purple stuff.'),
                use: (e) => e.showMessage('You try to open the lid. It\'s welded shut by time and neglect. Just like your career prospects.')
            },
            {
                name: 'Mop & Bucket', x: 465, y: 170, w: 65, h: 155,
                description: 'Your trusty mop and bucket — faithful companions.',
                look: (e) => {
                    if (e.getFlag('has_mop_handle')) {
                        e.showMessage('The bucket sits alone, mourning its partner. The mop handle has been... repurposed. The soggy mop head lies discarded on the floor like a sad gray octopus.');
                    } else {
                        e.showMessage('Your trusty mop and bucket. You\'ve spent thousands of hours with these faithful companions. The mop head is overdue for replacement by about three years. The handle looks solid though — good sturdy titanium alloy.');
                    }
                },
                get: (e) => {
                    if (e.getFlag('has_mop_handle')) {
                        e.showMessage('You already took the mop handle. The bucket gives you a look of betrayal.');
                    } else {
                        e.showMessage('You grab the mop and snap off the handle with a satisfying crack. The soggy mop head flops to the floor. "Sorry, old friend. I need this more than the floor does." You now have a sturdy titanium mop handle!');
                        e.setFlag('has_mop_handle');
                        e.addToInventory('mop_handle');
                        e.addScore(5);
                    }
                },
                use: (e) => {
                    if (e.getFlag('has_mop_handle')) {
                        e.showMessage('You\'ve already taken what you need from it. The bucket looks lonely.');
                    } else {
                        const px = engine.playerX, py = engine.playerY;
                        const sc = engine.playerSpriteScale(py);
                        // Hide the wall mop while it's being used in the animation
                        engine.setFlag('has_mop_handle');
                        e.playCutscene({
                            duration: 2800,
                            skippable: true,
                            draw: (ctx, w, h, progress) => {
                                miniAnimRedrawRoom(ctx, w, h);
                                // Walk to mop (0-25%)
                                const mopX = 497, walkPhase = Math.min(progress / 0.25, 1);
                                const curX = px + (mopX - px) * walkPhase;
                                const curY = py;
                                if (progress < 0.25) {
                                    // Walking to mop
                                    drawPlayerBody(ctx, curX, curY, sc, 0);
                                } else if (progress < 0.35) {
                                    // Pick up mop - arms raise
                                    const lift = (progress - 0.25) / 0.1;
                                    drawPlayerBody(ctx, mopX, curY, sc, lift * 0.8);
                                } else if (progress < 0.8) {
                                    // Mopping! Sweep back and forth
                                    const mopP = (progress - 0.35) / 0.45;
                                    const sweep = Math.sin(mopP * Math.PI * 4) * 30;
                                    drawPlayerBody(ctx, mopX + sweep * 0.3, curY, sc, 0.6);
                                    // Mop in hands — matching wall art: handle + head pad + strings
                                    const mx = mopX + sweep;
                                    const handleTop = curY - 14 * sc;
                                    ctx.fillStyle = '#AA8844';
                                    ctx.fillRect(mx - 2, handleTop, 4, 22 * sc);
                                    ctx.fillStyle = '#CCCCAA';
                                    ctx.fillRect(mx - 11, curY + 8 * sc, 22, 10);
                                    ctx.fillStyle = '#BBBB99';
                                    for (let i = 0; i < 5; i++) ctx.fillRect(mx - 9 + i * 4, curY + 18 * sc, 2, 5);
                                    // Wet streak on floor
                                    ctx.fillStyle = 'rgba(120,130,150,0.15)';
                                    ctx.beginPath();
                                    ctx.ellipse(mx, curY + 22 * sc, 12, 3, 0, 0, Math.PI * 2);
                                    ctx.fill();
                                } else {
                                    // Put mop back, walk back
                                    const retP = (progress - 0.8) / 0.2;
                                    const retX = mopX + (px - mopX) * retP;
                                    drawPlayerBody(ctx, retX, curY, sc, (1 - retP) * 0.4);
                                    // Carry mop back in hand until reaching the bucket
                                    if (retP < 0.7) {
                                        const mx = retX + 8;
                                        ctx.fillStyle = '#AA8844';
                                        ctx.fillRect(mx - 2, curY - 14 * sc, 4, 22 * sc);
                                        ctx.fillStyle = '#CCCCAA';
                                        ctx.fillRect(mx - 11, curY + 8 * sc, 22, 10);
                                        ctx.fillStyle = '#BBBB99';
                                        for (let i = 0; i < 5; i++) ctx.fillRect(mx - 9 + i * 4, curY + 18 * sc, 2, 5);
                                    }
                                }
                            },
                            onEnd: () => {
                                // Restore the mop to the wall — player just used it, didn't take it
                                delete engine.flags['has_mop_handle'];
                                engine.playerX = px;
                                engine.playerY = py;
                                e.showMessage('You give the floor a half-hearted mop stroke. Old habits die hard. But somehow you don\'t think mopping is going to fix THIS mess. Maybe the handle would be useful, though...');
                            }
                        });
                    }
                },
                talk: (e) => e.showMessage('"Goodbye, old friend. If I don\'t make it back... tell the squeegee I always respected her." The mop says nothing, but you sense its pride.')
            },
            {
                name: 'Purple Puddle', x: 114, y: 316, w: 58, h: 24,
                description: 'A puddle of mysterious purple fluid.',
                look: (e) => { if (!engine.getFlag('looked_puddle')) { engine.setFlag('looked_puddle'); e.addScore(2); } e.showMessage('A slowly expanding puddle of purple liquid, dripping from a bottle on the shelf above. You\'ve been meaning to clean that up for six months. It\'s developed a faint glow. That\'s... probably fine.'); },
                get: (e) => e.showMessage('You cup your hands and try to scoop up the purple goo. It slips through your fingers and leaves them tingling. And slightly purple. That\'ll wash out. Probably.'),
                use: (e) => e.showMessage('You consider mopping it up but then remember: the ship is exploding. Priorities, Wilkins. Priorities.'),
                talk: (e) => e.showMessage('"What ARE you?" you ask the puddle. It bubbles. You decide not to ask again.')
            },
            {
                name: 'Drink Puddle', x: 114, y: 331, w: 58, h: 10,
                description: 'The glowing purple fluid. Surely drinking it is a fine idea.',
                look: (e) => e.showMessage('Up close, the puddle smells faintly of ozone and regret.'),
                use: (e) => e.die('Against every warning label you\'ve ever cleaned off a bottle, you drink the glowing purple fluid. You have approximately four seconds to appreciate your life choices before you dissolve into a slightly-more-purple puddle. Congratulations: you are now the mess you were meant to clean.'),
                get: (e) => e.die('You cup a handful of glowing purple liquid and, in the sort of decision that separates janitors from astronauts, drink it. Your atoms briefly vibrate in a new and exciting key. Then they stop vibrating altogether.')
            },
            {
                name: 'Safety Poster', x: 540, y: 98, w: 50, h: 62,
                description: 'A safety awareness poster.',
                look: (e) => { if (!engine.getFlag('looked_poster')) { engine.setFlag('looked_poster'); e.addScore(3); } e.showMessage('"SAFETY FIRST!" declares the poster, featuring a cheerful stick figure. Below it reads "0 DAYS WITHOUT AN INCIDENT." Someone has written "THANKS, WILKINS" underneath in marker.'); },
                get: (e) => e.showMessage('You consider taking the poster as a souvenir. Then you notice it\'s bolted to the wall. Someone clearly anticipated this.'),
                use: (e) => e.showMessage('You update the counter to read "0 DAYS WITHOUT AN INCIDENT." Although technically an alien attack might be more than just an "incident."'),
                talk: (e) => e.showMessage('"I\'m sorry, little stick figure," you whisper. "I tried my best." The stick figure stares back with its empty circle head, judging you.')
            },
            {
                name: 'Vent Grille', x: 430, y: 86, w: 45, h: 34,
                description: 'A wall-mounted air vent.',
                look: (e) => e.showMessage('A ventilation grille. Dusty air wafts out — the ship\'s life support is still running, at least. You can hear distant clanking from deep inside the ductwork. Probably just the air recycler. Probably.'),
                get: (e) => e.showMessage('You tug at the grille. It\'s firmly bolted in place. Besides, crawling through air vents only works in movies. In real life you\'d get stuck at the first bend.'),
                use: (e) => e.showMessage('You peer through the slats. It\'s dark in there. Something moves. You decide you\'re fine right here.')
            },
            {
                name: 'Floor Drain', x: 350, y: 310, w: 30, h: 20,
                description: 'A floor drain.',
                look: (e) => e.showMessage('A standard deck drain. You\'ve unclogged it seventeen times. Lieutenant Patterson keeps "accidentally" dumping coffee grounds down it. You know it\'s deliberate, Patterson.'),
                get: (e) => e.showMessage('You are NOT sticking your hand down there. You know what\'s gone down that drain. You\'ve seen things, man. Terrible things.'),
                use: (e) => e.showMessage('The drain gurgles ominously. Given the state of the ship, you probably shouldn\'t be poking at the plumbing.')
            },
            {
                name: 'Alarm Light', x: 300, y: 12, w: 32, h: 22,
                description: 'Emergency alarm light.',
                look: (e) => e.showMessage('The emergency alarm is flashing CODE RED. That\'s the worst one. Worse than the time someone flushed a whole uniform down the zero-gravity toilet.'),
                get: (e) => e.showMessage('You reach up and try to yank the alarm light off the ceiling. It\'s firmly attached. Also, stealing emergency equipment during an emergency is probably frowned upon.'),
                use: (e) => e.showMessage('There\'s no "snooze" button on an emergency alarm. Believe me, you\'ve looked.'),
                talk: (e) => e.showMessage('"Yes, I KNOW there\'s an emergency. You\'ve been blaring for ten minutes. Some of us were NAPPING."')
            }
        ]
    });

    // ========== ROOM 2: CORRIDOR ==========
    engine.registerRoom({
        id: 'corridor',
        hint: (e) => {
            if (!e.hasItem('keycard')) return 'Dr. Chen will not be objecting to anything. Take her science clearance keycard.';
            if (!e.hasItem('cartridge')) return 'The science lab is east. Use Chen\'s keycard there.';
            return 'Head to the escape pod bay. Bring back-up supplies if you can find any.';
        },
        name: 'Ship Corridor',
        description: 'The main corridor of the ISS Constellation. Emergency lights cast an eerie red glow over devastation. Blast marks scar the walls. The ship has been attacked.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            // Sierra pseudo-3D: floor back edge y=255..275, front edge y=400.
            e.setDepthScaling(262, 380, 0.68, 1.0);
            // AGI-inspired barriers: fallen crew member, debris
            e.addBarrier(350, 325, 80, 20);    // Dr. Chen's body
            e.addBarrier(230, 315, 25, 15);    // Debris cluster left
            e.addBarrier(415, 345, 20, 15);    // Debris cluster right

            // Edge transitions for corridor (AGI EGOEDGE/NEWROOM)
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('broom_closet', 320, 310);
            });

            // Overhead strip lighting sits deep in the corridor, so cast shadows
            // fall toward the camera.
            e.setSceneLight(320, 90, 0.55);

            // Near conduit bundles frame the shot and give the empty foreground a
            // third depth plane the ego can walk behind.
            e.addForegroundLayer(352, (ctx, eng) => {
                const bob = Math.floor(eng.animTimer / 500) % 2;
                // Left conduit bundle, floor to ceiling
                ctx.fillStyle = '#12121e';
                ctx.fillRect(0, 17, 30, 383);
                ctx.fillStyle = '#1c1c2e';
                ctx.fillRect(20, 17, 8, 383);
                ctx.fillStyle = '#3b3b58';
                ctx.fillRect(29, 17, 2, 383);
                ctx.fillStyle = '#12121e';
                ctx.fillRect(0, 168, 36, 14);
                ctx.fillStyle = '#2a2a42';
                ctx.fillRect(0, 170, 34, 3);
                // Right-hand broken pipe, venting where it sheared
                ctx.fillStyle = '#12121e';
                ctx.fillRect(612, 17, 28, 383);
                ctx.fillStyle = '#3b3b58';
                ctx.fillRect(610, 17, 2, 383);
                ctx.fillStyle = '#12121e';
                ctx.fillRect(604, 236, 36, 12);
                ctx.fillStyle = `rgba(200,215,255,${bob ? 0.14 : 0.07})`;
                ctx.fillRect(596, 240, 16, 4);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Perspective corridor
            // Ceiling
            ctx.fillStyle = '#222240';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(200, 55); ctx.lineTo(440, 55); ctx.lineTo(640, 0);
            ctx.closePath(); ctx.fill();

            // Back wall
            metalWall(ctx, 200, 55, 240, 200);

            // Left wall
            ctx.fillStyle = '#2e2e50';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(200, 55); ctx.lineTo(200, 255); ctx.lineTo(0, 275);
            ctx.closePath(); ctx.fill();

            // Right wall
            ctx.fillStyle = '#2a2a4a';
            ctx.beginPath();
            ctx.moveTo(640, 0); ctx.lineTo(440, 55); ctx.lineTo(440, 255); ctx.lineTo(640, 275);
            ctx.closePath(); ctx.fill();

            // Floor
            ctx.fillStyle = '#484860';
            ctx.beginPath();
            ctx.moveTo(0, 275); ctx.lineTo(200, 255); ctx.lineTo(440, 255); ctx.lineTo(640, 275);
            ctx.lineTo(640, 400); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();

            // Perspective helpers for corridor walls
            // Left wall: top (0,0)→(200,55), bottom (0,275)→(200,255)
            const lTop = (x) => x * 0.275;
            const lBot = (x) => 275 - x * 0.1;
            // Right wall: top (640,0)→(440,55), bottom (640,275)→(440,255)
            const rTop = (x) => (640 - x) * 0.275;
            const rBot = (x) => 275 - (640 - x) * 0.1;

            // Left wall panels (perspective trapezoids)
            ctx.strokeStyle = '#3a3a5e';
            // Upper panel: ~7% to ~45% of wall height, x=20..90
            ctx.beginPath();
            ctx.moveTo(20, lTop(20) + 4); ctx.lineTo(90, lTop(90) + 4);
            ctx.lineTo(90, lTop(90) + 100); ctx.lineTo(20, lTop(20) + 100);
            ctx.closePath(); ctx.stroke();
            // Lower panel: ~48% to ~95% of wall height, x=20..90
            ctx.beginPath();
            ctx.moveTo(20, lTop(20) + 110); ctx.lineTo(90, lTop(90) + 110);
            ctx.lineTo(90, lBot(90) - 4); ctx.lineTo(20, lBot(20) - 4);
            ctx.closePath(); ctx.stroke();

            // Right wall panels (perspective trapezoids)
            // Upper panel: x=550..620
            ctx.beginPath();
            ctx.moveTo(550, rTop(550) + 4); ctx.lineTo(620, rTop(620) + 4);
            ctx.lineTo(620, rTop(620) + 100); ctx.lineTo(550, rTop(550) + 100);
            ctx.closePath(); ctx.stroke();
            // Lower panel: x=550..620
            ctx.beginPath();
            ctx.moveTo(550, rTop(550) + 110); ctx.lineTo(620, rTop(620) + 110);
            ctx.lineTo(620, rBot(620) - 4); ctx.lineTo(550, rBot(550) - 4);
            ctx.closePath(); ctx.stroke();

            // Scorch marks (back wall marks are flat — correct; left wall mark follows perspective)
            ctx.fillStyle = 'rgba(15,15,15,0.6)';
            ctx.fillRect(250, 90, 45, 35);
            ctx.fillRect(370, 110, 35, 25);
            // Left wall scorch mark — perspective quadrilateral
            ctx.beginPath();
            ctx.moveTo(80, lTop(80) + 130); ctx.lineTo(105, lTop(105) + 130);
            ctx.lineTo(105, lTop(105) + 170); ctx.lineTo(80, lTop(80) + 170);
            ctx.closePath(); ctx.fill();

            // Lab door (left wall — perspective trapezoid)
            // Left wall runs (0,0)→(200,55)→(200,255)→(0,275)
            // Door at t=0.1..0.5: near x=20, far x=100
            ctx.fillStyle = '#4a5e70';
            ctx.beginPath();
            ctx.moveTo(20, 86); ctx.lineTo(100, 99);
            ctx.lineTo(100, 265); ctx.lineTo(20, 273);
            ctx.closePath(); ctx.fill();
            // Inner panel
            ctx.fillStyle = '#5a7088';
            ctx.beginPath();
            ctx.moveTo(26, 90); ctx.lineTo(96, 102);
            ctx.lineTo(96, 262); ctx.lineTo(26, 270);
            ctx.closePath(); ctx.fill();
            // Center seam
            ctx.strokeStyle = '#3a4e60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(60, 93); ctx.lineTo(60, 268);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Lab label — skewed onto the door plane (top edge drops 13px over 80px).
            // Anchored clear of the near conduit that frames the left edge.
            ctx.save();
            ctx.translate(38, 134);
            ctx.transform(1, 0.1625, 0, 1, 0, 0);
            ctx.fillStyle = '#26323e';
            ctx.fillRect(-2, -10, 62, 26);
            ctx.fillStyle = '#1a232c';
            ctx.fillRect(-2, 14, 62, 2);
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillStyle = '#9CC4E4';
            ctx.fillText('SCIENCE', 0, 0);
            ctx.fillText('  LAB', 0, 12);
            ctx.restore();

            // Pod bay door (right wall — perspective trapezoid)
            // Right wall runs (640,0)→(440,55)→(440,255)→(640,275)
            // Door at t=0.1..0.5: near x=620, far x=540
            ctx.fillStyle = '#4a5e70';
            ctx.beginPath();
            ctx.moveTo(620, 86); ctx.lineTo(540, 99);
            ctx.lineTo(540, 265); ctx.lineTo(620, 273);
            ctx.closePath(); ctx.fill();
            // Inner panel
            ctx.fillStyle = '#5a7088';
            ctx.beginPath();
            ctx.moveTo(614, 90); ctx.lineTo(544, 102);
            ctx.lineTo(544, 262); ctx.lineTo(614, 270);
            ctx.closePath(); ctx.fill();
            // Center seam
            ctx.strokeStyle = '#3a4e60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(580, 93); ctx.lineTo(580, 268);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Pod label — mirror skew of the lab door
            ctx.save();
            ctx.translate(550, 132);
            ctx.transform(1, -0.1625, 0, 1, 0, 0);
            ctx.fillStyle = '#26323e';
            ctx.fillRect(-2, -10, 62, 26);
            ctx.fillStyle = '#1a232c';
            ctx.fillRect(-2, 14, 62, 2);
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillStyle = '#9CC4E4';
            ctx.fillText('ESCAPE', 0, 0);
            ctx.fillText(' PODS', 0, 12);
            ctx.restore();
            // Keycard reader — on wall next to door
            ctx.fillStyle = eng.getFlag('pod_bay_unlocked') ? '#22AA22' : '#AA2222';
            ctx.fillRect(534, 170, 6, 10);

            // Engine room door (right wall — further down-corridor than the pod door)
            ctx.fillStyle = '#3e4e5e';
            ctx.beginPath();
            ctx.moveTo(520, 134); ctx.lineTo(464, 143);
            ctx.lineTo(464, 250); ctx.lineTo(520, 257);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#4e6070';
            ctx.beginPath();
            ctx.moveTo(516, 138); ctx.lineTo(468, 146);
            ctx.lineTo(468, 247); ctx.lineTo(516, 253);
            ctx.closePath(); ctx.fill();
            // Door bent/forced open — slight offset on top panel
            ctx.fillStyle = '#3a3848';
            ctx.beginPath();
            ctx.moveTo(516, 138); ctx.lineTo(490, 142); ctx.lineTo(490, 193); ctx.lineTo(516, 194);
            ctx.closePath(); ctx.fill();
            // Eerie red glow from engine room leaking through gap
            ctx.fillStyle = 'rgba(200,50,20,0.18)';
            ctx.beginPath();
            ctx.moveTo(490, 142); ctx.lineTo(516, 138); ctx.lineTo(516, 194); ctx.lineTo(490, 193);
            ctx.closePath(); ctx.fill();
            // Engine room label — skewed onto the recessed door plane
            ctx.save();
            ctx.translate(472, 178);
            ctx.transform(1, -0.161, 0, 1, 0, 0);
            ctx.fillStyle = '#242c36';
            ctx.fillRect(-2, -8, 44, 22);
            ctx.font = 'bold 9px "Courier New"';
            ctx.fillStyle = '#9CC4E4';
            ctx.fillText('ENGINE', 0, 0);
            ctx.fillText('  ROOM', 0, 11);
            ctx.restore();

            // Supply Closet door (back wall)
            ctx.fillStyle = '#4a5e70';
            ctx.fillRect(285, 115, 72, 140);
            ctx.fillStyle = '#5a7088';
            ctx.fillRect(291, 121, 60, 128);
            // Door seam
            ctx.strokeStyle = '#3a4e60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(321, 121); ctx.lineTo(321, 249);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Closet label
            ctx.fillStyle = '#556688';
            ctx.font = '8px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('SUPPLY', 321, 155);
            ctx.fillText('CLOSET', 321, 165);
            ctx.textAlign = 'left';
            // Door handle
            ctx.fillStyle = '#888888';
            ctx.fillRect(310, 190, 4, 8);

            // Exposed wiring from blast damage
            ctx.strokeStyle = '#CCAA22';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(290, 90);
            ctx.lineTo(285, 105);
            ctx.lineTo(292, 115);
            ctx.stroke();
            // Sparks from wiring
            if (Math.floor(eng.animTimer / 200) % 5 === 0) {
                const sparkSeed = Math.floor(eng.animTimer / 200);
                ctx.fillStyle = '#FFFF55';
                ctx.fillRect(290 + (sparkSeed * 7 % 6), 112 + (sparkSeed * 13 % 6), 2, 2);
                ctx.fillRect(286 + (sparkSeed * 11 % 4), 108 + (sparkSeed * 17 % 4), 1, 1);
            }

            // Wall-mounted fire extinguisher (left wall — follows perspective)
            const extX = 130, extYBase = lTop(130) + 125;
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(extX, extYBase, 10, 22);
            ctx.fillStyle = '#AA1111';
            ctx.fillRect(extX + 2, extYBase - 5, 6, 7);
            ctx.fillStyle = '#333333';
            ctx.fillRect(extX + 3, extYBase - 7, 4, 4);

            // Deck number sign (back wall)
            ctx.fillStyle = '#334466';
            ctx.fillRect(300, 70, 40, 18);
            ctx.fillStyle = '#AABBDD';
            ctx.font = '10px "Courier New"';
            ctx.fillText('DECK 3', 303, 83);

            // Pipe along ceiling
            ctx.fillStyle = '#3a3a5e';
            ctx.fillRect(210, 56, 220, 4);
            // Pipe joints
            ctx.fillStyle = '#4a4a6e';
            ctx.fillRect(250, 55, 6, 6);
            ctx.fillRect(380, 55, 6, 6);

            // Blood smear near crew member
            ctx.fillStyle = 'rgba(120,20,20,0.3)';
            ctx.fillRect(350, 346, 18, 4);
            ctx.fillRect(356, 343, 9, 3);

            // Debris - more detail
            ctx.fillStyle = '#444';
            ctx.fillRect(240, 320, 35, 8);
            ctx.fillStyle = '#555';
            ctx.fillRect(245, 318, 12, 4);
            ctx.fillRect(420, 350, 24, 6);
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(150, 340, 18, 10);
            // Broken panel piece
            ctx.fillStyle = '#4a4a6a';
            ctx.fillRect(200, 355, 20, 6);
            ctx.fillStyle = '#5a5a7a';
            ctx.fillRect(202, 356, 16, 4);

            // Fallen crew member (Dr. Chen). Laid out along a receding axis with
            // the head nearest the camera, so she reads as a person rather than
            // another piece of floor debris. Kept clear of the closet-door walk
            // path so the ego never stands on top of her.
            const chenX = 394, chenGroundY = 344;
            ctx.save();
            ctx.translate(chenX, chenGroundY);
            eng.drawContactShadow(ctx, 1, -10, 1, {
                rx: 50, ry: 7, alpha: 0.34, rotation: -0.2, light: null
            });
            // Boots and legs, foreshortened away from the viewer. Kept warm
            // (brown/rose) rather than grey so she reads against the cool
            // blue-grey corridor floor instead of blending into it.
            ctx.fillStyle = '#241c18';
            ctx.fillRect(36, -28, 12, 7);
            ctx.fillStyle = '#6e5850';
            ctx.fillRect(12, -26, 26, 10);
            ctx.fillStyle = '#82695f';
            ctx.fillRect(12, -26, 26, 2);
            // Hips
            ctx.fillStyle = '#5c473f';
            ctx.fillRect(0, -24, 14, 14);
            // Torso in a lab coat — largest mass because it is nearest
            ctx.fillStyle = '#ab9490';
            ctx.fillRect(-24, -23, 26, 19);
            ctx.fillStyle = '#c4ada8';
            ctx.fillRect(-24, -23, 26, 3);
            ctx.fillStyle = '#8a726d';
            ctx.fillRect(-24, -7, 26, 3);
            // Coat lapel
            ctx.fillStyle = '#7a3a3a';
            ctx.fillRect(-12, -20, 4, 13);
            // Shoulder rolled toward the floor
            ctx.fillStyle = '#b8a19c';
            ctx.fillRect(-26, -20, 6, 12);
            // Outstretched arm and hand reaching toward the player
            ctx.fillStyle = '#ab9490';
            ctx.fillRect(-38, -8, 16, 6);
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(-46, -7, 9, 6);
            // Head, turned to one side
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(-40, -20, 17, 16);
            ctx.fillStyle = '#B98868';
            ctx.fillRect(-40, -8, 17, 4);
            // Dark hair spilling onto the deck
            ctx.fillStyle = '#222233';
            ctx.fillRect(-42, -22, 19, 7);
            ctx.fillRect(-46, -18, 6, 12);
            ctx.fillStyle = '#33334a';
            ctx.fillRect(-40, -22, 10, 2);

            // KEYCARD on body — only visible before pickup
            if (!eng.getFlag('got_keycard_corridor')) {
                const kcx = -19, kcy = -19;
                // Card body (small badge clipped to coat)
                ctx.fillStyle = '#DDDDCC';
                ctx.fillRect(kcx, kcy, 20, 12);
                // Card border
                ctx.strokeStyle = '#888877';
                ctx.lineWidth = 1;
                ctx.strokeRect(kcx, kcy, 20, 12);
                // Blue header stripe
                ctx.fillStyle = '#3344AA';
                ctx.fillRect(kcx + 1, kcy + 1, 18, 3);
                // Ambient glint on keycard
                const glintBlink = Math.floor(eng.animTimer / 300) % 2;
                ctx.fillStyle = glintBlink ? '#FFFF55' : '#888833';
                ctx.fillRect(kcx + 16, kcy + 1, 3, 3);
                // Tiny text
                ctx.fillStyle = '#CCCCEE';
                ctx.font = '2px "Courier New"';
                ctx.fillText('ISS', kcx + 2, kcy + 3);
                // Tiny photo
                ctx.fillStyle = '#CC9977';
                ctx.fillRect(kcx + 2, kcy + 5, 4, 5);
                ctx.fillStyle = '#222233';
                ctx.fillRect(kcx + 2, kcy + 5, 4, 2);
                // Name
                ctx.fillStyle = '#222222';
                ctx.font = '3px "Courier New"';
                ctx.fillText('CHEN', kcx + 8, kcy + 8);
                // Level text
                ctx.fillStyle = '#CC2222';
                ctx.font = '2px "Courier New"';
                ctx.fillText('LV.3', kcx + 8, kcy + 11);
                // Clip at top (attaching to uniform)
                ctx.fillStyle = '#888888';
                ctx.fillRect(kcx + 8, kcy - 2, 4, 3);
            }

            // Closed eyes (she's gone)
            ctx.fillStyle = '#222233';
            ctx.fillRect(-34, -13, 3, 1);
            ctx.fillRect(-28, -13, 3, 1);
            ctx.restore();

            // Emergency lights
            alarmLight(ctx, 140, 6, eng);
            alarmLight(ctx, 480, 6, eng);
            alarmLight(ctx, 295, 57, eng);
            alarmGlow(ctx, w, h, eng);

            // Light spilling onto the deck: the ceiling strip, the alarm domes and
            // the engine-room breach. Without these the floor read as flat colour.
            eng.lightPool(ctx, 320, 300, 190, '150,160,210', 0.21);
            const flare = Math.floor(eng.animTimer / 500) % 2 ? 0.2 : 0.09;
            eng.lightPool(ctx, 140, 300, 130, '255,60,50', flare);
            eng.lightPool(ctx, 480, 300, 130, '255,60,50', flare);
            eng.lightPool(ctx, 505, 285, 95, '220,70,30', 0.16);
            eng.vignette(ctx, 0.3);
        },
        hotspots: [
            {
                name: 'Science Lab', x: 15, y: 80, w: 90, h: 200, isExit: true, walkToX: 110, walkToY: 285,
                description: 'Door to the Science Lab.',
                look: (e) => e.showMessage('A door labeled "SCIENCE LAB". The emergency has knocked the security locks offline — it\'s unlocked.'),
                onExit: (e) => e.goToRoom('science_lab', 560, 310)
            },
            {
                name: 'Escape Pod Bay', x: 535, y: 80, w: 90, h: 200, isExit: true, walkToX: 540, walkToY: 285,
                description: 'Door to the Escape Pod Bay.',
                look: (e) => {
                    if (e.hasItem('keycard')) {
                        e.showMessage('The Escape Pod Bay door. Your keycard should work on the reader.');
                    } else {
                        e.showMessage('The Escape Pod Bay door. A keycard reader blinks red beside it. You\'ll need a Level 3 keycard to get through.');
                    }
                },
                onExit: (e) => {
                    if (e.hasItem('keycard')) {
                        e.setFlag('pod_bay_unlocked');
                        e.showMessage('You swipe Dr. Chen\'s keycard. The reader beeps green and the door slides open...');
                        e.goToRoom('pod_bay', 100, 310);
                    } else {
                        e.showMessage('ACCESS DENIED: LEVEL 3 SCIENCE CLEARANCE REQUIRED. Science clearance. You passed a scientist in the corridor, though she is not in any condition to object to paperwork.');
                    }
                }
            },
            {
                name: 'Supply Closet', x: 280, y: 110, w: 82, h: 150, isExit: true, walkToX: 320, walkToY: 280,
                description: 'The door back to the supply closet.',
                look: (e) => e.showMessage('The supply closet door \u2014 your former napping quarters. Through the open doorway you can see your old mop leaning faithfully against the wall.'),
                onExit: (e) => e.goToRoom('broom_closet', 320, 310)
            },
            {
                name: 'Fallen Crew Member', x: 346, y: 316, w: 98, h: 30,
                description: 'Someone lies motionless on the floor.',
                look: (e) => {
                    e.showMessage('It\'s Dr. Chen from the xenophysics team. She didn\'t make it. Whatever hit the ship was fast and merciless. You notice her security keycard is still clipped to her uniform pocket.');
                },
                get: (e) => {
                    if (!e.hasItem('keycard') && !e.getFlag('got_keycard_corridor')) {
                        e.showMessage('You carefully retrieve Dr. Chen\'s Level 3 keycard. She won\'t be needing it anymore. Rest easy, Doctor.');
                        e.addToInventory('keycard');
                        e.setFlag('got_keycard_corridor');
                        e.addScore(15);
                    } else if (e.hasItem('keycard')) {
                        e.showMessage('You\'ve already taken the keycard. There\'s nothing else to find.');
                    } else {
                        e.showMessage('There\'s nothing more to find here.');
                    }
                },
                talk: (e) => e.showMessage('She\'s gone. You offer a silent moment of respect.')
            },
            {
                name: 'Blast Marks', x: 245, y: 85, w: 50, h: 40,
                description: 'Scorch marks from energy weapons.',
                look: (e) => { if (!engine.getFlag('looked_blast_marks')) { engine.setFlag('looked_blast_marks'); e.addScore(3); } e.showMessage('Heavy blast marks from military-grade energy weapons. The attackers were well-armed and precise. This was no random pirate raid — this was a surgical strike.'); },
                get: (e) => e.showMessage('You try to scrape some carbon residue off the wall. Your janitor instincts are strong, but this isn\'t the time for spot-cleaning.'),
                talk: (e) => e.showMessage('"If these walls could talk..." Actually, given the state of the ship, you\'re glad they can\'t.')
            },
            {
                name: 'Sparking Wires', x: 275, y: 85, w: 30, h: 40,
                description: 'Exposed wiring sparking dangerously.',
                look: (e) => e.showMessage('Severed cables hang from the ceiling, sparking intermittently. Whoever attacked the ship did a thorough job on the electrical systems.'),
                get: (e) => e.showMessage('You reach toward the sparking wires. A spark zaps your finger. "OW!" You reconsider. Janitor training did NOT cover electrical repair.'),
                use: (e) => e.showMessage('You\'re a janitor, not an electrician. And even an electrician would probably just run away at this point.')
            },
            {
                name: 'Fire Extinguisher', x: 130, y: 145, w: 16, h: 35,
                description: 'A wall-mounted fire extinguisher.',
                look: (e) => e.showMessage('A standard-issue fire extinguisher, still in its bracket. The inspection tag shows it was last certified by... you. You wrote "looks fine" on the form without actually checking it.'),
                get: (e) => e.showMessage('You pull on it, but it\'s firmly clamped. Besides, what are you going to do — put out an alien invasion?'),
                use: (e) => e.showMessage('You briefly fantasize about spraying an alien invader with foam. Then you remember you don\'t even know if this thing works.')
            },
            {
                name: 'Deck Sign', x: 290, y: 68, w: 50, h: 22,
                description: 'A deck identification sign.',
                look: (e) => e.showMessage('"DECK 3 — SCIENCE & ENGINEERING." Underneath someone scratched "and broom closets." You wonder who did that. It was you. You did that.'),
                get: (e) => e.showMessage('The sign is bolted to the bulkhead. You\'d need a power tool to remove it— and leaving evidence of your graffiti is probably unwise anyway.')
            },
            {
                name: 'Engine Room', x: 455, y: 120, w: 75, h: 145, isExit: true, walkToX: 500, walkToY: 285,
                description: 'A door labeled "ENGINE ROOM". Something must have gone badly wrong in there — you can see the glow of emergency lighting through the gap.',
                look: (e) => e.showMessage('The engine room door on the starboard wall. It\'s been forced open — the blast impact must have bent the frame. Flickering red light seeps through the gap.'),
                onExit: (e) => e.goToRoom('engine_room', 55, 340)
            }
        ]
    });

    // ========== ROOM 3: SCIENCE LAB ==========
    engine.registerRoom({
        id: 'science_lab',
        hint: 'Look for a data cartridge among the smashed equipment. The Draknoids missed it.',
        name: 'Science Lab',
        description: 'The ship\'s science lab. Equipment is smashed and overturned, but some computers still flicker with power. The attackers were looking for something specific.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            // Sierra pseudo-3D: floor runs 270..400.
            e.setDepthScaling(276, 378, 0.72, 1.0);
            // AGI-inspired barriers: lab table legs, overturned chair
            e.addBarrier(245, 280, 180, 8);    // Lab table base spans walkable area
            e.addBarrier(195, 285, 35, 25);    // Overturned chair

            // Foreground layer: lab table edge draws over player walking behind it
            e.addForegroundLayer(285, (ctx) => {
                ctx.fillStyle = '#555570';
                ctx.fillRect(240, 268, 185, 4); // Table front edge
            });

            // Overhead strip, deep in the room.
            e.setSceneLight(330, 40, 0.5);

            // Edge transition: right side back to corridor
            e.setEdgeTransition('right', (eng) => {
                eng.goToRoom('corridor', 120, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            const lightOn = Math.floor(eng.animTimer / 300) % 3 !== 0;
            // Sierra pseudo-3D shell: ceiling wedge, back wall, converging side
            // walls and a receding floor. Side props are perspective trapezoids.
            const BW_L = 170, BW_R = 500, BW_T = 50, BW_B = 262, EDGE = 290;
            const lTop = (x) => x * (BW_T / BW_L);
            const lBot = (x) => EDGE - x * ((EDGE - BW_B) / BW_L);
            const rTop = (x) => (w - x) * (BW_T / (w - BW_R));
            const rBot = (x) => EDGE - (w - x) * ((EDGE - BW_B) / (w - BW_R));

            ctx.fillStyle = '#20203c';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_R, BW_T); ctx.lineTo(w, 0);
            ctx.closePath(); ctx.fill();

            metalWall(ctx, BW_L, BW_T, BW_R - BW_L, BW_B - BW_T, '#2e2e48', '#343458');

            ctx.fillStyle = '#282842';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_L, BW_B); ctx.lineTo(0, EDGE);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#242440';
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(BW_R, BW_T); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#3a3a54';
            ctx.beginPath();
            ctx.moveTo(0, EDGE); ctx.lineTo(BW_L, BW_B); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#41415c';
            ctx.beginPath();
            ctx.moveTo(BW_L + 40, BW_B); ctx.lineTo(BW_R - 40, BW_B); ctx.lineTo(w - 50, h); ctx.lineTo(50, h);
            ctx.closePath(); ctx.fill();

            ctx.strokeStyle = '#3a3a5e';
            ctx.lineWidth = 1;
            [42, 92, 142].forEach((x) => {
                ctx.beginPath(); ctx.moveTo(x, lTop(x) + 6); ctx.lineTo(x, lBot(x) - 6); ctx.stroke();
            });
            [540, 580, 616].forEach((x) => {
                ctx.beginPath(); ctx.moveTo(x, rTop(x) + 6); ctx.lineTo(x, rBot(x) - 6); ctx.stroke();
            });

            // Ceiling light strip, narrowing toward the back wall
            ctx.fillStyle = lightOn ? '#aabbcc' : '#334455';
            ctx.beginPath();
            ctx.moveTo(258, 10); ctx.lineTo(402, 10); ctx.lineTo(384, 44); ctx.lineTo(276, 44);
            ctx.closePath(); ctx.fill();

            // Main terminal, mounted on the left wall
            const tTop = (x) => lTop(x) + (lBot(x) - lTop(x)) * 0.18;
            const tBot = (x) => lTop(x) + (lBot(x) - lTop(x)) * 0.64;
            ctx.fillStyle = '#2a3040';
            ctx.beginPath();
            ctx.moveTo(25, tTop(25)); ctx.lineTo(160, tTop(160));
            ctx.lineTo(160, tBot(160)); ctx.lineTo(25, tBot(25));
            ctx.closePath(); ctx.fill();
            const sTop = (x) => lTop(x) + (lBot(x) - lTop(x)) * 0.22;
            const sBot = (x) => lTop(x) + (lBot(x) - lTop(x)) * 0.50;
            ctx.fillStyle = lightOn ? '#112244' : '#0d1524';
            ctx.beginPath();
            ctx.moveTo(36, sTop(36)); ctx.lineTo(150, sTop(150));
            ctx.lineTo(150, sBot(150)); ctx.lineTo(36, sBot(36));
            ctx.closePath(); ctx.fill();
            if (lightOn) {
                drawPerspectiveSurface(ctx, 114, 70, {
                    tl: { x: 36, y: sTop(36) }, tr: { x: 150, y: sTop(150) },
                    br: { x: 150, y: sBot(150) }, bl: { x: 36, y: sBot(36) }
                }, (screen) => {
                    screen.fillStyle = '#33AA55';
                    screen.font = '8px "Courier New"';
                    screen.fillText('SYSTEM CRITICAL', 8, 15);
                    screen.fillText('HULL BREACH: DECK 3', 8, 28);
                    screen.fillText('LIFE SUPPORT: 47%', 8, 41);
                    screen.fillText('CREW STATUS: 1 ALIVE', 8, 54);
                    screen.fillStyle = '#FFAA22';
                    screen.fillText('> DATA PORT ACTIVE_', 8, 68);
                });
            }
            // Console shelf under the screen
            ctx.fillStyle = '#383848';
            ctx.beginPath();
            ctx.moveTo(40, sBot(40) + 6); ctx.lineTo(148, sBot(148) + 6);
            ctx.lineTo(148, tBot(148) - 6); ctx.lineTo(40, tBot(40) - 6);
            ctx.closePath(); ctx.fill();

            // Data cartridge in the port
            if (!eng.getFlag('got_cartridge')) {
                const cartridgeTop = (x) => sBot(x) + 11;
                const cartridgeBottom = (x) => sBot(x) + 18;
                ctx.fillStyle = '#CCAA33';
                ctx.beginPath();
                ctx.moveTo(118, cartridgeTop(118)); ctx.lineTo(136, cartridgeTop(136));
                ctx.lineTo(136, cartridgeBottom(136)); ctx.lineTo(118, cartridgeBottom(118));
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#DDBB44';
                ctx.beginPath();
                ctx.moveTo(121, cartridgeTop(121) + 1); ctx.lineTo(134, cartridgeTop(134) + 1);
                ctx.lineTo(134, cartridgeBottom(134) - 1); ctx.lineTo(121, cartridgeBottom(121) - 1);
                ctx.closePath(); ctx.fill();
            }

            // Specimen cases, mounted on the right wall
            const cTop = (x) => rTop(x) + (rBot(x) - rTop(x)) * 0.12;
            const cBot = (x) => rTop(x) + (rBot(x) - rTop(x)) * 0.82;
            ctx.fillStyle = '#2a3040';
            ctx.beginPath();
            ctx.moveTo(510, cTop(510)); ctx.lineTo(620, cTop(620));
            ctx.lineTo(620, cBot(620)); ctx.lineTo(510, cBot(510));
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#444460';
            [0.28, 0.5, 0.72].forEach((f) => {
                const yy = (x) => rTop(x) + (rBot(x) - rTop(x)) * f;
                ctx.beginPath(); ctx.moveTo(516, yy(516)); ctx.lineTo(614, yy(614)); ctx.stroke();
            });
            ctx.fillStyle = 'rgba(100,140,180,0.16)';
            ctx.beginPath();
            ctx.moveTo(532, 104); ctx.lineTo(550, 116); ctx.lineTo(529, 128);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#CC9922';
            ctx.font = '7px "Courier New"';
            ctx.fillText('\u26a0 BIOHAZARD', 522, 214);

            // Lab tables (centre, on the floor)
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath(); ctx.ellipse(330, 270, 105, 9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#6b6b88';
            ctx.fillRect(240, 180, 180, 8);
            ctx.fillStyle = '#4a4a66';
            ctx.fillRect(240, 188, 180, 4);
            ctx.fillStyle = '#585874';
            ctx.fillRect(250, 192, 7, 76);
            ctx.fillRect(409, 192, 7, 76);
            ctx.fillStyle = '#555568';
            ctx.fillRect(260, 160, 40, 20);
            ctx.fillStyle = '#445055';
            ctx.fillRect(320, 165, 50, 15);
            ctx.fillStyle = '#665555';
            ctx.fillRect(390, 155, 25, 25);
            ctx.fillStyle = 'rgba(150,180,200,0.3)';
            ctx.fillRect(280, 296, 15, 3);
            ctx.fillRect(310, 306, 10, 2);
            ctx.fillRect(350, 292, 12, 3);

            // Exit door on the back wall
            ctx.fillStyle = '#4a5e70';
            ctx.fillRect(424, 96, 68, 166);
            ctx.fillStyle = '#5a7088';
            ctx.fillRect(429, 101, 58, 156);
            ctx.fillStyle = '#3e5060';
            ctx.fillRect(456, 101, 3, 156);
            ctx.fillStyle = '#8899AA';
            ctx.font = '9px "Courier New"';
            ctx.fillText('EXIT', 445, 186);

            // Overturned chair. Warm wood-tone against the cool blue-grey floor
            // (the flat #444458 it used before sat almost on top of the floor
            // colour and was invisible despite being a real hotspot).
            ctx.fillStyle = '#7a5a34';
            ctx.fillRect(198, 302, 34, 8);
            ctx.fillStyle = '#8f6a3e';
            ctx.fillRect(198, 302, 34, 3);
            // Legs splayed in the air
            ctx.strokeStyle = '#5c4326';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(202, 302); ctx.lineTo(196, 282);
            ctx.moveTo(212, 302); ctx.lineTo(210, 280);
            ctx.moveTo(222, 310); ctx.lineTo(232, 292);
            ctx.moveTo(230, 310); ctx.lineTo(244, 296);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Backrest, fallen to the side
            ctx.fillStyle = '#8f6a3e';
            ctx.fillRect(196, 292, 6, 16);
            ctx.fillStyle = '#a5804e';
            ctx.fillRect(196, 292, 2, 16);

            // Spilled specimen vials on floor
            ctx.fillStyle = '#44CC88';
            ctx.fillRect(350, 310, 6, 16);
            ctx.fillStyle = '#33BB77';
            ctx.fillRect(362, 312, 6, 14);
            ctx.fillStyle = 'rgba(50,200,120,0.15)';
            ctx.beginPath(); ctx.ellipse(362, 326, 12, 5, 0.2, 0, Math.PI * 2); ctx.fill();

            // Microscope still standing
            ctx.fillStyle = '#555568';
            ctx.fillRect(392, 148, 6, 30);
            ctx.fillRect(388, 145, 14, 5);
            ctx.fillStyle = '#666678';
            ctx.fillRect(389, 140, 12, 6);
            ctx.fillStyle = '#334455';
            ctx.beginPath(); ctx.arc(395, 138, 4, 0, Math.PI * 2); ctx.fill();

            // Holographic periodic table on the back wall
            if (lightOn) {
                ctx.fillStyle = 'rgba(80,150,200,0.12)';
                ctx.fillRect(196, 66, 120, 45);
                ctx.strokeStyle = 'rgba(80,150,200,0.25)';
                ctx.strokeRect(196, 66, 120, 45);
                ctx.fillStyle = 'rgba(100,180,220,0.3)';
                ctx.font = '6px "Courier New"';
                ctx.fillText('Xe  Qn  Zr  Pl  Dk', 201, 78);
                ctx.fillText('Fe  Au  Ag  Cu  Sn', 201, 88);
                ctx.fillText('H   He  Li  Be  B', 201, 98);
            }

            // Smeared footprints (attacker tracks)
            ctx.fillStyle = 'rgba(30,30,30,0.12)';
            ctx.fillRect(300, 296, 12, 16);
            ctx.fillRect(330, 291, 12, 16);
            ctx.fillRect(360, 296, 12, 16);

            // --- Lab dressing ---
            // Specimen tanks on the back wall. One is cracked and drained; the
            // other still holds something that has not stopped moving.
            const bob = Math.sin(eng.animTimer / 900) * 3;
            const twitch = Math.sin(eng.animTimer / 240) * 1.5;
            [[322, false], [356, true]].forEach(([tx, alive]) => {
                ctx.fillStyle = '#191f2e';
                ctx.fillRect(tx, 60, 32, 88);
                ctx.fillStyle = '#3c4356';
                ctx.fillRect(tx, 60, 32, 5);
                ctx.fillRect(tx, 143, 32, 5);
                ctx.fillStyle = alive ? '#0f3a2c' : '#2a2030';
                ctx.fillRect(tx + 3, 66, 26, 76);
                if (alive) {
                    ctx.fillStyle = '#1d6b4a';
                    ctx.fillRect(tx + 3, 74, 26, 68);
                    // Suspended specimen: a knot of tendrils, slowly drifting
                    ctx.fillStyle = '#7FE0A8';
                    ctx.fillRect(tx + 10, 96 + bob, 12, 12);
                    ctx.fillStyle = '#B8F5D0';
                    ctx.fillRect(tx + 13, 99 + bob, 3, 3);
                    ctx.fillStyle = '#4FBF88';
                    ctx.fillRect(tx + 6, 106 + bob + twitch, 5, 2);
                    ctx.fillRect(tx + 21, 105 + bob - twitch, 5, 2);
                    ctx.fillRect(tx + 14, 108 + bob, 2, 9);
                    ctx.fillRect(tx + 18, 108 + bob, 2, 7);
                    // Rising bubbles
                    for (let bI = 0; bI < 4; bI++) {
                        const by = 140 - ((eng.animTimer / 14 + bI * 21) % 70);
                        ctx.fillStyle = 'rgba(200,255,225,0.45)';
                        ctx.fillRect(tx + 6 + bI * 5, by, 2, 2);
                    }
                } else {
                    // Cracked glass and a dry residue line where the fluid sat
                    ctx.strokeStyle = '#8894AA';
                    ctx.beginPath();
                    ctx.moveTo(tx + 5, 70); ctx.lineTo(tx + 17, 92);
                    ctx.lineTo(tx + 10, 104); ctx.lineTo(tx + 25, 130);
                    ctx.stroke();
                    ctx.fillStyle = '#4a3550';
                    ctx.fillRect(tx + 3, 128, 26, 14);
                }
                // Glass highlight down the left curve of the cylinder
                ctx.fillStyle = 'rgba(190,215,255,0.16)';
                ctx.fillRect(tx + 5, 68, 3, 72);
                ctx.fillStyle = '#7E8AA0';
                ctx.font = '5px "Courier New"';
                ctx.fillText(alive ? 'SPEC-114' : 'SPEC-113', tx + 2, 152);
            });

            // Severed cable runs dumped out of the ceiling by the blast
            ctx.lineWidth = 2;
            [[206, '#8a5a20'], [216, '#2a4a7a'], [226, '#6a2a2a'], [470, '#2a4a7a'], [482, '#8a5a20']].forEach(([cx, col], i) => {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.moveTo(cx, 50);
                ctx.quadraticCurveTo(cx + (i % 2 ? 14 : -14), 82, cx + (i % 2 ? 4 : -6), 118 + i * 5);
                ctx.stroke();
            });
            ctx.lineWidth = 1;
            if (Math.floor(eng.animTimer / 180) % 6 === 0) {
                ctx.fillStyle = '#FFFF55';
                ctx.fillRect(220, 122, 2, 2);
                ctx.fillRect(224, 126, 1, 1);
            }

            // Centrifuge, lid up and rotor still coasting
            ctx.fillStyle = '#3c4356';
            ctx.fillRect(258, 156, 44, 24);
            ctx.fillStyle = '#6b7488';
            ctx.fillRect(258, 152, 44, 5);
            ctx.fillStyle = '#141a26';
            ctx.fillRect(263, 160, 34, 14);
            const spin = (eng.animTimer / 300) % 1;
            ctx.fillStyle = '#8895AA';
            ctx.fillRect(263 + Math.floor(spin * 30), 164, 5, 6);
            ctx.fillStyle = Math.floor(eng.animTimer / 700) % 2 ? '#FF5555' : '#661111';
            ctx.fillRect(296, 154, 4, 3);

            // Beaker rack, one still bubbling over a hotplate that nobody switched off
            ctx.fillStyle = '#3a4450';
            ctx.fillRect(318, 172, 54, 8);
            ctx.fillRect(318, 162, 3, 12);
            ['#44CC88', '#CC8844', '#5588CC', '#AA55CC'].forEach((liq, i) => {
                const bx = 322 + i * 13;
                ctx.fillStyle = 'rgba(200,225,255,0.22)';
                ctx.fillRect(bx, 158, 9, 14);
                ctx.fillStyle = liq;
                ctx.fillRect(bx + 1, 165, 7, 6);
                if (i === 0) {
                    const bubY = 165 - ((eng.animTimer / 20 + i * 30) % 14);
                    ctx.fillStyle = 'rgba(120,255,190,0.6)';
                    ctx.fillRect(bx + 4, bubY, 2, 2);
                }
            });

            alarmLight(ctx, 310, 5, eng);
            alarmGlow(ctx, w, h, eng);

            // Ceiling strip and the live tank spill onto the deck.
            eng.lightPool(ctx, 330, 300, 175, '170,190,225', lightOn ? 0.22 : 0.07);
            eng.lightPool(ctx, 372, 200, 80, '80,220,150', 0.13);
            eng.vignette(ctx, 0.3);
        },
        hotspots: [
            {
                name: 'Computer Terminal', x: 25, y: 55, w: 137, h: 132,
                description: 'A large computer terminal, still partially operational.',
                look: (e) => e.showMessage('The main science terminal is damaged but still running on backup power. The screen shows critical ship status. There\'s an active data port — you might be able to retrieve something.'),
                get: (e) => e.showMessage('You can\'t take the whole terminal. But maybe there\'s something in the data port...'),
                use: (e) => {
                    if (!e.getFlag('got_cartridge')) {
                        e.showMessage('You access the terminal. The Quantum Drive research data is still in the data port! You eject the cartridge.');
                        e.addToInventory('cartridge');
                        e.setFlag('got_cartridge');
                        e.addScore(15);
                    } else {
                        e.showMessage('The terminal has nothing more of use. Most data was corrupted in the attack.');
                    }
                }
            },
            {
                name: 'Data Cartridge', x: 116, y: 156, w: 22, h: 15,
                get hidden() { return engine.getFlag('got_cartridge'); },
                description: 'A small data cartridge plugged into the terminal.',
                look: (e) => e.showMessage('A data cartridge is plugged into the terminal\'s data port. The label reads "QUANTUM DRIVE v3.1". This must be what the attackers were after!'),
                get: (e) => {
                    e.showMessage('You carefully eject the data cartridge and pocket it. This contains the Quantum Drive specifications — the most valuable data on the ship!');
                    e.addToInventory('cartridge');
                    e.setFlag('got_cartridge');
                    e.addScore(15);
                }
            },
            {
                name: 'Lab Equipment', x: 240, y: 150, w: 185, h: 45,
                description: 'Smashed lab equipment scattered across a table.',
                look: (e) => e.showMessage('The lab tables are covered in smashed equipment — microscopes, spectral analyzers, petri dishes. The attackers tore through here looking for something. They must have been after the Quantum Drive data.'),
                get: (e) => e.showMessage('It\'s all smashed beyond usefulness. Broken glass and twisted components.')
            },
            {
                name: 'Specimen Cases', x: 508, y: 38, w: 114, h: 200,
                description: 'Broken specimen display cases.',
                look: (e) => { if (!engine.getFlag('looked_specimens')) { engine.setFlag('looked_specimens'); e.addScore(3); } e.showMessage('Glass specimen cases, all smashed open. Whatever xenobiological samples were stored here are now splattered across the floor. You try not to think about it.'); },
                get: (e) => e.showMessage('You gingerly poke through the shattered glass. Nothing intact. Though you\'re not sure you\'d want to pick up an alien specimen anyway.'),
                use: (e) => e.showMessage('The cases are utterly destroyed. Whatever was in them is now free-range. Great.'),
                talk: (e) => e.showMessage('"Is... is anything in here still alive?" you whisper. Something squelches. You decide not to investigate further.')
            },
            {
                name: 'Microscope', x: 385, y: 135, w: 20, h: 50,
                description: 'A microscope, miraculously still standing.',
                look: (e) => e.showMessage('Against all odds, one microscope survived the carnage. It stands proudly amid the destruction like a tiny monument to scientific resilience.'),
                get: (e) => e.showMessage('It\'s bolted to the table. Scientists don\'t trust janitors near their expensive equipment. You can\'t imagine why.'),
                use: (e) => e.showMessage('You peer through the eyepiece. There\'s still a slide loaded — some kind of cell structure you don\'t recognize. Fascinating, if you had any idea what you were looking at.')
            },
            {
                name: 'Overturned Chair', x: 195, y: 285, w: 35, h: 25,
                description: 'A chair knocked over in the attack.',
                look: (e) => e.showMessage('A lab chair tipped on its side. You feel a strong urge to pick it up. Maintaining orderly furniture is deep in your janitor DNA.'),
                get: (e) => e.showMessage('You right the chair. There. One small act of order in a universe of chaos. You feel slightly better.'),
                use: (e) => e.showMessage('You briefly consider sitting down, but there\'s a crisis happening. No time for sitting. Although your feet ARE killing you.')
            },
            {
                name: 'Exit', x: 420, y: 92, w: 76, h: 172, isExit: true, walkToX: 458, walkToY: 330,
                description: 'Door back to the corridor.',
                onExit: (e) => e.goToRoom('corridor', 120, 310)
            },
            {
                name: 'Specimen Tanks', x: 318, y: 56, w: 74, h: 96,
                description: 'Two containment cylinders on the back wall.',
                look: (e) => e.showMessage('Two containment cylinders. SPEC-113 is cracked and drained, its occupant long since evaporated into a purple crust. SPEC-114 is intact, and the thing inside is still moving. It has noticed you. It presses a tendril against the glass in what you desperately hope is a wave.'),
                get: (e) => e.showMessage('You put your hand on the release valve, think about every documentary you have ever seen, and put your hand back in your pocket.'),
                use: (e) => e.showMessage('The control panel offers PURGE, VENT, and RELEASE. Every one of those options ends the same way and you are not in that kind of story.'),
                talk: (e) => e.showMessage('"Hey buddy. Bad day?" The specimen rotates slowly to face you. You take that as a yes.')
            },
            {
                name: 'Centrifuge', x: 256, y: 150, w: 48, h: 32,
                description: 'A benchtop centrifuge, still coasting down.',
                look: (e) => e.showMessage('A benchtop centrifuge with the lid flipped open mid-run. The rotor is still turning, slowly, hours after whoever started it stopped needing the results.'),
                get: (e) => e.showMessage('It is bolted to the bench, weighs more than you do, and is currently full of somebody\'s blood samples. Hard pass.'),
                use: (e) => e.showMessage('You close the lid. The machine beeps once, gratefully, and keeps spinning. Somewhere in the universe, one procedure is still going to plan.')
            }
        ]
    });

    // ========== ROOM 4: ESCAPE POD BAY ==========
    engine.registerRoom({
        id: 'pod_bay',
        hint: (e) => {
            if (!e.hasItem('survival_kit')) return 'The emergency locker on the left wall holds a survival kit. Take it before you launch — there is no way back.';
            if (!e.hasItem('medkit') && !e.getFlag('korvak_freed')) return 'You have the survival kit. There is still a medkit in the engine room cabinet, and someone down there badly needs it.';
            return 'Board the pod and use the launch controls. There is no way back, so make sure your inventory is complete.';
        },
        name: 'Escape Pod Bay',
        description: 'The Escape Pod Bay. Most pods have already launched. One remains — your ticket off this doomed ship.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_hum');
            // Sierra pseudo-3D: floor runs 258..400.
            e.setDepthScaling(276, 378, 0.72, 1.0);

            // Launch floods sit high and forward of the bays.
            e.setSceneLight(320, 40, 0.5);

            // Near safety railing and a dropped cargo pallet frame the launch
            // apron and give the empty foreground a plane to walk behind.
            e.addForegroundLayer(360, (ctx, eng) => {
                const strobe = Math.floor(eng.animTimer / 400) % 2;
                // Gap on the left keeps the corridor doorway readable.
                ctx.fillStyle = '#20202f';
                ctx.fillRect(104, 356, 536, 7);
                ctx.fillStyle = '#3a3a52';
                ctx.fillRect(104, 356, 536, 2);
                for (let px = 120; px < 640; px += 96) {
                    ctx.fillStyle = '#20202f';
                    ctx.fillRect(px, 356, 9, 44);
                    ctx.fillStyle = '#3a3a52';
                    ctx.fillRect(px, 356, 2, 44);
                }
                // Hazard chevrons along the apron edge
                for (let hx = 104; hx < 640; hx += 24) {
                    ctx.fillStyle = (((hx - 104) / 24) & 1) ? '#c8a416' : '#1b1b28';
                    ctx.fillRect(hx, 366, 24, 4);
                }
                // Abandoned cargo pallet, bottom right
                ctx.fillStyle = '#1c2030';
                ctx.fillRect(508, 372, 96, 28);
                ctx.fillStyle = '#2c3348';
                ctx.fillRect(508, 372, 96, 4);
                ctx.fillStyle = strobe ? '#FF7744' : '#5a2a14';
                ctx.fillRect(596, 376, 5, 4);
            });

            // Edge transition: left back to corridor
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('corridor', 540, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Sierra pseudo-3D shell: ceiling wedge, back wall, converging side
            // walls and a receding floor. Bays and lockers are wall trapezoids.
            const BW_L = 150, BW_R = 490, BW_T = 46, BW_B = 258, EDGE = 288;
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

            ctx.fillStyle = '#141430';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_R, BW_T); ctx.lineTo(w, 0);
            ctx.closePath(); ctx.fill();

            ditherRect(ctx, BW_L, BW_T, BW_R - BW_L, BW_B - BW_T, '#0a0a24', '#1a1a44', 3);

            ctx.fillStyle = '#141433';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(BW_L, BW_T); ctx.lineTo(BW_L, BW_B); ctx.lineTo(0, EDGE);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#10102c';
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(BW_R, BW_T); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#33334e';
            ctx.beginPath();
            ctx.moveTo(0, EDGE); ctx.lineTo(BW_L, BW_B); ctx.lineTo(BW_R, BW_B); ctx.lineTo(w, EDGE);
            ctx.lineTo(w, h); ctx.lineTo(0, h);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#3b3b58';
            ctx.beginPath();
            ctx.moveTo(BW_L + 40, BW_B); ctx.lineTo(BW_R - 40, BW_B); ctx.lineTo(w - 60, h); ctx.lineTo(60, h);
            ctx.closePath(); ctx.fill();

            ctx.strokeStyle = '#2a2a55'; ctx.lineWidth = 1;
            [40, 85, 128].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, lTop(x) + 5); ctx.lineTo(x, lBot(x) - 5); ctx.stroke(); });
            [512, 556, 600].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, rTop(x) + 5); ctx.lineTo(x, rBot(x) - 5); ctx.stroke(); });

            // Ceiling light rail, narrowing toward the back wall
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.moveTo(210, 12); ctx.lineTo(440, 12); ctx.lineTo(410, 42); ctx.lineTo(240, 42);
            ctx.closePath(); ctx.fill();

            // Spent pod bay on the left wall
            ctx.fillStyle = '#0d0d22';
            trap(18, 130, 0.10, 0.44, lBand); ctx.fill();
            ctx.strokeStyle = '#444466';
            trap(18, 130, 0.10, 0.44, lBand); ctx.stroke();
            ctx.fillStyle = '#886622';
            ctx.font = '9px "Courier New"';
            ctx.fillText('LAUNCHED', 34, 96);

            // Spent pod bays on the back wall
            [170, 285].forEach((bx) => {
                ctx.fillStyle = '#0d0d22';
                ctx.fillRect(bx, 140, 80, 110);
                ctx.strokeStyle = '#444466';
                ctx.strokeRect(bx, 140, 80, 110);
                ctx.fillStyle = '#886622';
                ctx.font = '9px "Courier New"';
                ctx.fillText('LAUNCHED', bx + 8, 200);
                ctx.fillStyle = '#333355';
                ctx.fillRect(bx + 6, 150, 12, 6);
                ctx.fillRect(bx + 62, 150, 12, 6);
                ctx.fillRect(bx + 6, 236, 12, 6);
                ctx.fillRect(bx + 62, 236, 12, 6);
            });

            // Active pod bay recess on the right wall
            const px = 500;
            ctx.fillStyle = '#0d0d22';
            trap(500, 628, 0.06, 0.90, rBand); ctx.fill();
            ctx.strokeStyle = '#22AA44';
            ctx.lineWidth = 2;
            trap(500, 628, 0.06, 0.90, rBand); ctx.stroke();
            ctx.lineWidth = 1;

            if (!eng.getFlag('pod_launched')) {
                // Launch tube guide rails behind the capsule.
                ctx.fillStyle = '#1b1b2e';
                ctx.fillRect(500, 56, 10, 182);
                ctx.fillRect(618, 40, 10, 216);
                ctx.fillStyle = '#4a4a68';
                ctx.fillRect(500, 56, 3, 182);
                ctx.fillRect(618, 40, 3, 216);
                // Same capsule as the launch cinematic, stood on its tail.
                drawEscapePod(ctx, 558, 132, 5, -Math.PI / 2);
                // Base clamp gripping the heat shield
                ctx.fillStyle = '#1b1b2e';
                ctx.fillRect(502, 190, 124, 14);
                ctx.fillStyle = '#4a4a68';
                ctx.fillRect(502, 190, 124, 3);
                ctx.fillStyle = '#CCAA22';
                ctx.fillRect(512, 194, 6, 6);
                ctx.fillRect(610, 194, 6, 6);
                // Bay decals
                ctx.fillStyle = '#AABBCC';
                ctx.font = 'bold 10px "Courier New"';
                ctx.fillText('POD 4', 524, 220);
                ctx.fillStyle = '#22FF44';
                ctx.fillRect(506, 229, 5, 5);
                ctx.fillStyle = '#22CC44';
                ctx.font = '8px "Courier New"';
                ctx.fillText('STATUS: READY', 516, 234);
            } else {
                ctx.fillStyle = '#886622';
                ctx.font = '10px "Courier New"';
                ctx.fillText('LAUNCHED', px + 20, 145);
            }

            // Emergency locker on the left wall
            ctx.fillStyle = '#445566';
            trap(18, 72, 0.50, 0.86, lBand); ctx.fill();
            ctx.strokeStyle = '#556677';
            trap(18, 72, 0.50, 0.86, lBand); ctx.stroke();
            ctx.fillStyle = eng.getFlag('got_kit') ? '#554433' : '#CC3333';
            ctx.fillRect(36, 170, 18, 5);
            ctx.fillRect(43, 163, 5, 19);
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#8899AA';
            ctx.fillText('EMRG', 30, 226);

            // Launch control panel on the back wall
            ctx.fillStyle = '#333350';
            ctx.fillRect(396, 176, 78, 76);
            ctx.fillStyle = '#444465';
            ctx.fillRect(401, 181, 68, 66);
            ctx.fillStyle = '#22AA44';
            ctx.fillRect(410, 190, 14, 14);
            ctx.fillStyle = '#AA2222';
            ctx.fillRect(430, 190, 14, 14);
            ctx.fillStyle = '#AAAA22';
            ctx.fillRect(450, 190, 14, 14);
            ctx.fillStyle = '#8899AA';
            ctx.font = '7px "Courier New"';
            ctx.fillText('LAUNCH CTRL', 404, 228);

            // Space window on the back wall
            ctx.fillStyle = '#060620';
            ctx.fillRect(252, 58, 150, 64);
            ctx.strokeStyle = '#555577';
            ctx.strokeRect(252, 58, 150, 64);
            ctx.save();
            ctx.beginPath();
            ctx.rect(253, 59, 148, 62);
            ctx.clip();
            ctx.translate(252, 58);
            stars(ctx, 150, 64, 777, 26, 0.65);
            ctx.restore();
            ctx.fillStyle = '#AA8855';
            ctx.beginPath();
            ctx.arc(360, 92, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#BBAA66';
            ctx.beginPath();
            ctx.arc(360, 92, 16, -0.5, 0.8);
            ctx.fill();

            alarmLight(ctx, 310, 2, eng);
            alarmGlow(ctx, w, h, eng);
        },
        hotspots: [
            {
                name: 'Escape Pod', x: 500, y: 40, w: 120, h: 200, isExit: true, walkToX: 550, walkToY: 280,
                description: 'The last remaining escape pod.',
                look: (e) => {
                    if (e.getFlag('pod_launched')) {
                        e.showMessage('The pod bay is empty. You already launched.');
                    } else {
                        e.showMessage('A single-occupant escape pod — the last one left. Status indicator shows READY. This is your way off the Constellation. Just climb in and hit the launch button.');
                    }
                },
                onExit: (e) => {
                    if (e.getFlag('pod_launched')) {
                        e.showMessage('The pod is already gone.');
                        return;
                    }
                    if (!e.hasItem('cartridge') && !e.getFlag('pod_warn_cartridge')) {
                        e.showMessage('Some uncharacteristically merciful instinct stops you. The science lab still holds the drive specs — you can improvise without them later, but it will be considerably harder.');
                        e.setFlag('pod_warn_cartridge');
                        return;
                    }
                    // Survival Kit is strongly recommended (you\'ll die in the desert without it) — warn once
                    if (!e.hasItem('survival_kit') && !e.getFlag('got_kit') && !e.getFlag('pod_warn_kit')) {
                        e.showMessage('Your survival instinct clears its throat and glances toward the emergency locker.');
                        e.setFlag('pod_warn_kit');
                        return;
                    }
                    engine.sound.pod();
                    e.showMessage('You climb into the escape pod, strap in, and slam the launch button. The pod rockets away from the dying Constellation toward the desert planet below...');
                    e.setFlag('pod_launched');
                    e.addScore(25);
                    e.playCutscene({
                        duration: 6000,
                        draw: cutscenePodLaunch,
                        onEnd: () => e.goToRoom('desert', 320, 305),
                        skippable: true
                    });
                },
                get: (e) => e.showMessage('You need to walk into the pod, not carry it!')
            },
            {
                name: 'Emergency Locker', x: 14, y: 142, w: 62, h: 106,
                description: 'An emergency supply locker.',
                look: (e) => {
                    if (e.getFlag('got_kit')) {
                        e.showMessage('The emergency locker is empty. You already took the survival kit.');
                    } else {
                        e.showMessage('A wall-mounted emergency locker marked with a red cross. Standard issue on all fleet vessels. It should contain a survival kit.');
                    }
                },
                get: (e) => {
                    if (!e.getFlag('got_kit')) {
                        e.showMessage('You open the locker and grab the survival kit inside. Water purification tablets, nutrient bars, and a signal mirror. Could come in handy.');
                        e.addToInventory('survival_kit');
                        e.setFlag('got_kit');
                        e.addScore(10);
                    } else {
                        e.showMessage('The locker is empty.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('got_kit')) {
                        e.showMessage('You open the locker and grab the survival kit inside. Water purification tablets, nutrient bars, and a signal mirror. Could come in handy.');
                        e.addToInventory('survival_kit');
                        e.setFlag('got_kit');
                        e.addScore(10);
                    } else {
                        e.showMessage('The locker is empty.');
                    }
                }
            },
            {
                name: 'Space Window', x: 248, y: 54, w: 158, h: 72,
                description: 'A viewport showing space outside.',
                look: (e) => { if (!engine.getFlag('looked_window')) { engine.setFlag('looked_window'); e.addScore(3); } e.showMessage('Through the viewport you can see a desert planet looming close. The Constellation is in a decaying orbit — it won\'t last much longer. You also spot a large alien warship departing. The attackers got what they came for... or did they?'); }
            },
            {
                name: 'Launch Controls', x: 392, y: 172, w: 86, h: 84,
                description: 'Pod bay launch controls.',
                look: (e) => e.showMessage('Launch control panel for escape pod bay 4. Green means ready, red means abort, yellow means... you\'re not sure. You slept through that briefing.'),
                use: (e) => {
                    if (e.getFlag('pod_launched')) {
                        e.showMessage('All pods have been launched.');
                    } else {
                        e.showMessage('You can launch the pod after boarding it. Climb into the pod first!');
                    }
                }
            },
            {
                name: 'Empty Pod Bays', x: 165, y: 136, w: 205, h: 118,
                description: 'Empty pod bays.',
                look: (e) => e.showMessage('Three empty pod bays. The rest of the crew launched already... if there was anyone left alive to launch them. Only Pod Bay 4 still has a pod.')
            },
            {
                name: 'Corridor', x: 0, y: 282, w: 90, h: 118, isExit: true, walkToX: 45, walkToY: 340,
                description: 'Back to the corridor.',
                onExit: (e) => e.goToRoom('corridor', 540, 310)
            }
        ]
    });

});
