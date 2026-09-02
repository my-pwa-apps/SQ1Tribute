// ============================================================
// STAR SWEEPER - DOCKING BAY, DRAKNOID BRIG AND FLAGSHIP
// ============================================================

StarSweeper.defineRooms((engine) => {
    // ========== ROOM 12: DOCKING BAY (Kerona Starport) ==========
    engine.registerRoom({
        id: 'docking_bay',
        transition: 'wipe',
        hint: (e) => {
            if (!e.getFlag('pipz_gave_items')) return 'The wrecked freighter is the only thing worth searching here. Get through the hull breach, then talk to whoever is hiding inside.';
            if (!e.hasItem('cargo_manifest')) return 'There is still a cargo manifest to pick up from the wreck.';
            return 'This wreck has given up everything it has. You fly out from the landing pad back at the outpost, not from here.';
        },
        name: 'Kerona Docking Bay',
        description: 'A ramshackle docking bay on the outskirts of Kerona\'s frontier post. The wrecked cargo freighter Ironclad Star dominates the far end, half-buried in sand.',
        onEnter: (e) => {
            e.sound.startAmbient('desert_wind');
            e.setDepthScaling(260, 380, 0.75, 1.1);
            // First arrival replays how the Ironclad Star ended up here.
            if (!e.getFlag('saw_freighter_crash')) {
                e.setFlag('saw_freighter_crash');
                e.playCutscene({
                    duration: 9000,
                    skippable: true,
                    draw: cutsceneFreighterCrash,
                    onEnd: () => { e.playerVisible = true; }
                });
            }
            // Bay wall barriers
            e.addBarrier(0, 230, 80, 60);     // Left bay wall
            e.addBarrier(560, 230, 80, 60);   // Right bay wall
            e.addBarrier(160, 230, 300, 20);  // Freighter hull base
            e.addBarrier(254, 300, 24, 24);   // Pipz occupies her own patch of ground

            // Pipz draws as a y-sorted actor so the player passes behind her
            // correctly instead of always rendering in front.
            e.addForegroundLayer(322, (ctx, eng) => {
                const px = 265, py = 308;
                eng.drawContactShadow(ctx, px, py + 13, 1, { rx: 12, ry: 3.5, alpha: 0.26 });
                ctx.fillStyle = '#885533';
                ctx.beginPath(); ctx.arc(px, py - 22, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#BB7744';
                ctx.fillRect(px - 6, py - 16, 12, 16);
                ctx.fillStyle = '#665533';
                ctx.fillRect(px - 8, py, 8, 12); ctx.fillRect(px + 2, py + 2, 8, 10);
                ctx.fillStyle = '#331100';
                ctx.fillRect(px - 7, py - 30, 14, 8);
                ctx.fillStyle = '#fff';
                ctx.fillRect(px - 4, py - 25, 4, 4); ctx.fillRect(px + 1, py - 25, 4, 4);
                ctx.fillStyle = '#2255AA';
                ctx.fillRect(px - 3, py - 24, 2, 2); ctx.fillRect(px + 2, py - 24, 2, 2);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Sky — Kerona harsh midday
            gradientRect(ctx, 0, 0, w, 260, '#882200', '#CC7733');

            // Distant mesas frame the wreck and establish a hot, open-air bay.
            ctx.fillStyle = '#98451f';
            ctx.beginPath();
            ctx.moveTo(0, 220); ctx.lineTo(70, 188); ctx.lineTo(132, 196); ctx.lineTo(190, 176);
            ctx.lineTo(252, 199); ctx.lineTo(324, 184); ctx.lineTo(388, 204); ctx.lineTo(470, 174);
            ctx.lineTo(548, 198); ctx.lineTo(640, 182); ctx.lineTo(640, 260); ctx.lineTo(0, 260);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#b15b2b';
            ctx.beginPath();
            ctx.moveTo(0, 238); ctx.lineTo(104, 213); ctx.lineTo(198, 226); ctx.lineTo(286, 210);
            ctx.lineTo(382, 232); ctx.lineTo(488, 210); ctx.lineTo(640, 230); ctx.lineTo(640, 260); ctx.lineTo(0, 260);
            ctx.closePath(); ctx.fill();
            // Ground — packed sand and tarmac converging under the wreck.
            perspectiveFloor(ctx, 260, w, h, '#8c6034', '#6d4828');
            // Dithered horizon
            ditherRect(ctx, 0, 250, w, 20, '#CC7733', '#AA7744', 4);

            // Bay walls left and right (structural pylons)
            for (const bx of [0, 540]) {
                ctx.fillStyle = '#556670';
                ctx.fillRect(bx, 120, 80, 200);
                ctx.fillStyle = '#445560';
                ctx.fillRect(bx + (bx === 0 ? 0 : 8), 120, 24, 200);
                // Rivet lines
                for (let ry = 140; ry < 300; ry += 20) {
                    ctx.fillStyle = '#667780';
                    ctx.fillRect(bx + 12, ry, 4, 4);
                    ctx.fillRect(bx + 56, ry, 4, 4);
                }
            }

            // Overhead hangar roof structure
            ctx.fillStyle = '#445566';
            ctx.fillRect(60, 60, w - 120, 40);
            ctx.fillStyle = '#334455';
            ctx.fillRect(60, 60, w - 120, 10);
            // Roof lights
            for (let lx = 100; lx < w - 80; lx += 80) {
                ctx.fillStyle = Math.floor(Date.now() / 800) % 2 ? '#FFDD44' : '#AA9922';
                ctx.fillRect(lx, 68, 20, 12);
                ctx.fillStyle = 'rgba(255,200,50,0.2)';
                ctx.beginPath(); ctx.arc(lx + 10, 80, 22, 0, Math.PI * 2); ctx.fill();
            }

            // Wrecked freighter (Ironclad Star) — centre-back
            ctx.fillStyle = 'rgba(35,22,22,0.34)';
            ctx.beginPath(); ctx.ellipse(326, 270, 196, 25, 0, 0, Math.PI * 2); ctx.fill();
            // Same Kepler-class hauler seen intact in the distress cinematic,
            // here broken-backed with her cargo spine snapped.
            drawFreighter(ctx, 307, 182, 2, true);
            // Sand drifted against the settled hull so she sits in the ground.
            ctx.fillStyle = '#7d5530';
            ctx.beginPath();
            ctx.moveTo(96, 276); ctx.lineTo(140, 256); ctx.lineTo(214, 262);
            ctx.lineTo(300, 252); ctx.lineTo(392, 264); ctx.lineTo(470, 256);
            ctx.lineTo(524, 274); ctx.lineTo(524, 288); ctx.lineTo(96, 288);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#9c6c3c';
            ctx.beginPath();
            ctx.moveTo(96, 276); ctx.lineTo(140, 256); ctx.lineTo(214, 262);
            ctx.lineTo(300, 252); ctx.lineTo(392, 264); ctx.lineTo(470, 256);
            ctx.lineTo(524, 274); ctx.lineTo(520, 279); ctx.lineTo(468, 262);
            ctx.lineTo(392, 270); ctx.lineTo(300, 258); ctx.lineTo(214, 268);
            ctx.lineTo(140, 262); ctx.lineTo(100, 280);
            ctx.closePath(); ctx.fill();

            // Crash debris gives the foreground story detail and stronger scale.
            ctx.fillStyle = '#394955';
            ctx.beginPath(); ctx.moveTo(104, 326); ctx.lineTo(138, 314); ctx.lineTo(153, 325); ctx.lineTo(118, 333); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#6d7880';
            ctx.fillRect(111, 319, 18, 3);
            ctx.fillStyle = '#2b3540';
            ctx.beginPath(); ctx.moveTo(500, 336); ctx.lineTo(526, 320); ctx.lineTo(540, 330); ctx.lineTo(518, 343); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#aa5522';
            ctx.fillRect(535, 351, 4, 4);
            ctx.fillRect(548, 360, 2, 2);

            // Nav console — accessible from breach (if breach is entered)
            if (eng.getFlag('entered_freighter')) {
                // Dim interior glow from breach
                ctx.fillStyle = 'rgba(0,100,200,0.12)';
                ctx.beginPath();
                ctx.moveTo(195, 146); ctx.lineTo(219, 134); ctx.lineTo(247, 154);
                ctx.lineTo(255, 186); ctx.lineTo(231, 198); ctx.lineTo(203, 186);
                ctx.closePath(); ctx.fill();
            }

            // Cargo manifest — on the ground near the breach
            if (!eng.getFlag('got_manifest')) {
                ctx.fillStyle = '#DDCC88';
                ctx.fillRect(302, 310, 20, 28);
                ctx.fillStyle = '#BBAA66';
                ctx.fillRect(304, 312, 16, 24);
                ctx.fillStyle = '#555533';
                ctx.font = '6px "Courier New"';
                ctx.fillText('MAN', 307, 322);
                ctx.fillText('IFEST', 305, 330);
            }

            // Outpost exit — left edge
            ctx.fillStyle = '#335544';
            ctx.fillRect(0, 260, 30, 120);
            ctx.font = '8px "Courier New"';
            ctx.fillStyle = '#AACCAA';
            ctx.save(); ctx.translate(14, 340); ctx.rotate(-Math.PI / 2);
            ctx.fillText('OUTPOST', 0, 0); ctx.restore();

            // Room label
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#556644';
            ctx.fillText('KERONA DOCKING BAY - IRONCLAD STAR CRASH SITE', 10, 395);
        },
        hotspots: [
            {
                name: 'Ironclad Star',
                x: 158, y: 108, w: 324, h: 156,
                description: 'The wrecked freighter Ironclad Star. She was a Kepler-class cargo hauler. Not anymore.',
                look: (e) => {
                    if (!e.getFlag('looked_ironclad')) { e.setFlag('looked_ironclad'); e.addScore(2); }
                    e.showMessage('The Ironclad Star. Draknoid ion cannons tore her apart on re-entry. It\'s a miracle anyone survived. The hull breach on the port side looks wide enough to squeeze through.');
                },
                use: (e) => {
                    if (!e.getFlag('entered_freighter')) {
                        e.setFlag('entered_freighter');
                        e.addScore(3);
                        e.showMessage('You pick your way carefully through the hull breach into the freighter\'s wrecked interior. The emergency lighting still flickers dimly.');
                    } else {
                        e.showMessage('You\'ve already been inside. Everything useful has been extracted, apart from the cargo manifest.');
                    }
                }
            },
            {
                name: 'Hull Breach',
                x: 198, y: 135, w: 55, h: 60,
                description: 'A ragged opening torn in the hull.',
                look: (e) => e.showMessage('The breach is big enough to crawl through. The interior of the freighter\'s cargo hold is dark and tilted at an angle.'),
                use: (e) => {
                    if (!e.getFlag('entered_freighter')) {
                        e.setFlag('entered_freighter');
                        e.addScore(3);
                        e.showMessage('You squeeze through the breach. Inside the wreck it\'s dark and smells of fuel. You can see a flickering nav console deeper in — and something else moving in the shadows...');
                    } else {
                        e.showMessage('You\'ve scoped it out. Nothing left in there except the manifest on the ground outside.');
                    }
                }
            },
            {
                name: 'Cargo Manifest',
                x: 299, y: 308, w: 28, h: 32,
                get hidden() { return engine.getFlag('got_manifest'); },
                description: 'A battered data-clipboard lying on the ground. A cargo manifest.',
                look: (e) => e.showMessage('It\'s the Ironclad Star\'s cargo manifest. The last entry reads: "2x civilian colonists, Sector 9 resettlement." Signed three days ago.'),
                get: (e) => {
                    e.addToInventory('cargo_manifest');
                    e.setFlag('got_manifest');
                    e.addScore(5);
                    e.showMessage(e.hasItem('frequency_chip')
                        ? 'You pick up the cargo manifest. The last entry lists two colonists aboard. Its ship IDs and Pipz\'s frequency chip might make a useful pair.'
                        : 'You pick up the cargo manifest. The last entry lists two colonists aboard. Someone survived this wreck — or didn\'t make it out.');
                }
            },
            {
                name: 'Pipz',
                x: 248, y: 274, w: 46, h: 56,
                description: 'A small figure huddled in the shade of the wreck.',
                look: (e) => {
                    if (!e.getFlag('met_pipz')) {
                        e.setFlag('met_pipz');
                        e.addScore(5);
                        e.showMessage('It\'s a kid — maybe twelve years old. She\'s wearing torn freighter coveralls several sizes too big. Her eyes are wide and red from crying.');
                    } else {
                        e.showMessage('The kid watches you warily with large, tired eyes.');
                    }
                },
                talk: (e) => e.startDialog('pipz')
            },
            {
                name: 'Outpost Exit',
                x: 0, y: 255, w: 32, h: 130, isExit: true, walkToX: 50, walkToY: 340,
                description: 'Back to the frontier outpost.',
                look: (e) => e.showMessage('The path back to the outpost.'),
                onExit: (e) => e.goToRoom('outpost', 570, 310)
            }
        ]
    });

    // ========== ROOM 13: DRAKNOID BRIG ==========
    engine.registerRoom({
        id: 'draknoid_brig',
        transition: 'iris',
        hint: (e) => {
            if (e.getFlag('rescued_prisoners')) return 'Time to deal with the Draknoid flagship itself.';
            if (e.hasItem('prisoner_badge')) return 'The prisoner badge Pipz gave you authorises this whole cell block — try it on the cell control panel.';
            if (e.hasItem('plasma_cutter')) return 'Use the plasma cutter on the cell bars.';
            return 'The cells open with either an authorised prisoner badge or a plasma cutter. Pipz had a badge; Korvak in the engine room had a cutter.';
        },
        name: 'Draknoid Brig',
        description: 'A dimly lit detention block deep inside the Draknoid flagship. Rows of cells line both sides of a narrow corridor, their bar doors sealed magnetically.',
        onEnter: (e) => {
            e.sound.startAmbient('draknoid_ship');
            e.setDepthScaling(260, 370, 0.72, 1.05);
            // Cell bar barriers — can't walk into cells
            e.addBarrier(30, 200, 120, 150);
            e.addBarrier(490, 200, 120, 150);

            // The only light is the strip running down the middle of the block.
            e.setSceneLight(320, 60, 0.45);

            // Near cell-bay uprights frame the corridor and darken the foreground.
            e.addForegroundLayer(366, (ctx, eng) => {
                const flick = Math.floor(eng.animTimer / 500) % 2;
                [[0, 44], [596, 44]].forEach(([bx, bw]) => {
                    ctx.fillStyle = '#05050e';
                    ctx.fillRect(bx, 80, bw, 320);
                    ctx.fillStyle = '#1e1e38';
                    ctx.fillRect(bx === 0 ? bx + bw - 3 : bx, 80, 3, 320);
                });
                ctx.fillStyle = '#05050e';
                ctx.fillRect(0, 366, 640, 34);
                ctx.fillStyle = '#1b1b34';
                ctx.fillRect(0, 366, 640, 3);
                // Deck plating seams stop the near band reading as a letterbox bar
                ctx.fillStyle = '#12122a';
                for (let sx = -40; sx < 700; sx += 80) {
                    ctx.beginPath();
                    ctx.moveTo(sx, 400); ctx.lineTo(sx + 26, 369);
                    ctx.lineTo(sx + 28, 369); ctx.lineTo(sx + 3, 400);
                    ctx.closePath(); ctx.fill();
                }
                ctx.fillStyle = flick ? 'rgba(200,60,50,0.16)' : 'rgba(200,60,50,0.06)';
                ctx.fillRect(0, 369, 640, 31);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Dark corridor background
            gradientRect(ctx, 0, 0, w, h, '#060612', '#0e0e22');
            perspectiveFloor(ctx, 270, w, h, '#14142a', '#30305a');
            // Floor runner narrows toward the hatch: depth without guide lines.
            ctx.fillStyle = '#1b1b38';
            ctx.beginPath();
            ctx.moveTo(286, 272); ctx.lineTo(354, 272); ctx.lineTo(508, 400); ctx.lineTo(132, 400);
            ctx.closePath(); ctx.fill();
            ditherRect(ctx, 0, 330, w, 16, '#0e0e22', '#1a1a2e', 3);
            // Ceiling
            ctx.fillStyle = '#0a0a18';
            ctx.fillRect(0, 0, w, 80);

            // Ribbed ceiling and a central light spine converge on the hatch.
            ctx.fillStyle = '#17172d';
            [[40, 188], [124, 228], [212, 274], [428, 366], [516, 412]].forEach(([outer, inner]) => {
                ctx.beginPath();
                ctx.moveTo(outer, 0); ctx.lineTo(inner, 80); ctx.lineTo(inner + 5, 80); ctx.lineTo(outer + 9, 0);
                ctx.closePath(); ctx.fill();
            });
            ctx.fillStyle = '#243a58';
            ctx.beginPath();
            ctx.moveTo(276, 0); ctx.lineTo(364, 0); ctx.lineTo(344, 80); ctx.lineTo(296, 80);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(90,150,220,0.34)';
            ctx.fillRect(302, 34, 36, 5);

            // Alarm flicker
            alarmGlow(ctx, w, h, eng);

            // Cell blocks taper toward the main-deck hatch.
            ctx.fillStyle = '#1a1a30';
            ctx.beginPath();
            ctx.moveTo(20, 145); ctx.lineTo(170, 175); ctx.lineTo(170, 330); ctx.lineTo(20, 360);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(620, 145); ctx.lineTo(470, 175); ctx.lineTo(470, 330); ctx.lineTo(620, 360);
            ctx.closePath(); ctx.fill();

            // Cold cell-interior planes separate prisoners from the corridor.
            ctx.fillStyle = '#090916';
            ctx.beginPath(); ctx.moveTo(28, 169); ctx.lineTo(155, 184); ctx.lineTo(155, 326); ctx.lineTo(28, 348); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(612, 169); ctx.lineTo(485, 184); ctx.lineTo(485, 326); ctx.lineTo(612, 348); ctx.closePath(); ctx.fill();
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#596080';
            ctx.fillText('7-A', 30, 178);
            ctx.fillText('7-B', 112, 187);
            ctx.fillText('7-C', 494, 187);
            ctx.fillText('7-D', 574, 178);

            // Left cell bars (2 cells)
            const barsOpen = eng.getFlag('brig_cells_open');
            ctx.fillStyle = '#2a2a45'; ctx.fillRect(20, 156, 140, 10); // top beam
            drawPrisonBars(ctx, 20, 156, 65, 194, 4);
            drawPrisonBars(ctx, 86, 156, 65, 194, 4);
            // Right bars
            ctx.fillStyle = '#2a2a45'; ctx.fillRect(480, 156, 140, 10);
            drawPrisonBars(ctx, 480, 156, 65, 194, 4);
            drawPrisonBars(ctx, 547, 156, 65, 194, 4);

            // Cyan edge glints make the magnetic bars readable in the darkness.
            ctx.fillStyle = 'rgba(100,180,220,0.22)';
            [44, 65, 101, 122, 504, 525, 568, 589].forEach((x) => ctx.fillRect(x, 166, 2, 178));

            // Cell control panels (one each side)
            ctx.fillStyle = '#1e1e36';
            ctx.fillRect(150, 240, 34, 60);
            ctx.fillStyle = barsOpen ? '#22AA44' : '#AA2222';
            ctx.fillRect(156, 246, 10, 10); // status LED
            ctx.fillStyle = '#556677';
            ctx.fillRect(158, 262, 16, 6);
            ctx.fillRect(158, 272, 16, 6);

            ctx.fillStyle = '#1e1e36';
            ctx.fillRect(456, 240, 34, 60);
            ctx.fillStyle = barsOpen ? '#22AA44' : '#AA2222';
            ctx.fillRect(462, 246, 10, 10);

            // Prisoners in cells (Jorv and Mella — only visible if cells not open)
            if (!barsOpen) {
                // Left cell — Jorv (tall male, silver-streaked hair)
                ctx.fillStyle = '#996644'; // skin
                ctx.beginPath(); ctx.arc(54, 296, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#334488';
                ctx.fillRect(47, 300, 14, 26);
                ctx.fillStyle = '#556699';
                ctx.fillRect(47, 300, 14, 6); // collar
                ctx.fillStyle = '#CCCCCC'; // silver hair
                ctx.fillRect(47, 288, 14, 7);

                // Right of left block — Mella (shorter, auburn hair)
                ctx.fillStyle = '#BB8866';
                ctx.beginPath(); ctx.arc(112, 300, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#553366';
                ctx.fillRect(106, 304, 12, 22);
                ctx.fillStyle = '#AA4422'; // auburn hair
                ctx.fillRect(106, 291, 12, 8);

                // Right cells — two other Constellation crew
                ctx.fillStyle = '#AA9977';
                ctx.beginPath(); ctx.arc(508, 298, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#335544'; ctx.fillRect(502, 302, 12, 20);

                ctx.fillStyle = '#CC9966';
                ctx.beginPath(); ctx.arc(568, 296, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#443322'; ctx.fillRect(562, 300, 14, 22);

                // Hands gripping bars
                ctx.fillStyle = '#996644';
                ctx.fillRect(82, 280, 5, 10); ctx.fillRect(90, 280, 5, 10); // Jorv hands
                ctx.fillStyle = '#BB8866';
                ctx.fillRect(82, 290, 4, 8); ctx.fillRect(90, 290, 4, 8);
            } else {
                // Cells open — prisoners freed, show open cell interiors
                ctx.fillStyle = 'rgba(0,160,80,0.06)'; ctx.fillRect(20, 160, 140, 190);
                ctx.fillStyle = 'rgba(0,160,80,0.06)'; ctx.fillRect(480, 160, 140, 190);
            }

            // Corridor lit panels (ceiling recessed)
            for (let clx = 180; clx < 480; clx += 80) {
                ctx.fillStyle = Math.floor(Date.now() / 700) % 2 ? '#223355' : '#1a2840';
                ctx.fillRect(clx, 30, 50, 16);
                ctx.fillStyle = 'rgba(50,100,180,0.15)';
                ctx.beginPath(); ctx.arc(clx + 25, 52, 28, 0, Math.PI * 2); ctx.fill();
            }

            // Floor guide lamps recede toward the exit hatch.
            [[208, 354, 8], [432, 354, 8], [250, 316, 6], [390, 316, 6], [284, 286, 4], [352, 286, 4]].forEach(([x, y, size]) => {
                ctx.fillStyle = '#162e42';
                ctx.fillRect(x - 2, y - 2, size + 4, 5);
                ctx.fillStyle = '#55bbee';
                ctx.fillRect(x, y, size, 2);
            });

            // Corridor end — hatch back to draknoid ship main area
            drawDoorway(ctx, 280, 100, 80, 170, 'MAIN DECK', false, '#4a2a6a');

            // Badge reader on wall near hatch
            ctx.fillStyle = '#222236';
            ctx.fillRect(370, 160, 28, 50);
            ctx.fillStyle = barsOpen ? '#225522' : '#552222';
            ctx.fillRect(374, 164, 20, 16);
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#667788';
            ctx.fillText('CELL', 376, 192);
            ctx.fillText('CTRL', 376, 200);

            // Room label
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#336655';
            ctx.fillText('DETENTION BLOCK 7 — DRAKNOID FLAGSHIP', 10, 395);
        },
        hotspots: [
            {
                name: 'Left Cells',
                x: 18, y: 154, w: 140, h: 198,
                description: 'Magnetic-lock cells. Two civilian prisoners are held here.',
                look: (e) => {
                    if (!e.getFlag('brig_cells_open')) {
                        if (!e.getFlag('looked_brig_cells')) { e.setFlag('looked_brig_cells'); e.addScore(5); }
                        e.showMessage('"Hey! HEY! Over here!" A man in torn freighter coveralls grabs the bars. "I\'m Jorv Vance. This is my wife, Mella. Our daughter Pipz escaped the boarding — have you seen her? Please get us out of here!"');
                    } else {
                        e.showMessage('The cells stand open and empty. The locks have been deactivated.');
                    }
                },
                useItem: (e, id) => {
                    if (id === 'prisoner_badge') {
                        releasePrisoners(e, id, '"THANK YOU!" Jorv Vance clasps your hand. "Pipz — she\'s alive?" You nod. The big man blinks away tears. "Lead us out of here. Please."');
                    } else if (id === 'plasma_cutter') {
                        releasePrisoners(e, id, '"You cut us out!" Jorv stares at the plasma-cut bars. "What took you so long?" Mella rolls her eyes. "He means thank you."');
                    } else {
                        e.showMessage(e.getFlag('brig_cells_open') ? 'The cells are already open.' : 'That won\'t open a magnetic lock.');
                    }
                }
            },
            {
                name: 'Right Cells',
                x: 478, y: 154, w: 140, h: 198,
                description: 'More cells. Two more Constellation crew members are held here.',
                look: (e) => {
                    if (!e.getFlag('brig_cells_open')) {
                        e.showMessage('Two more crew members — both in bad shape. One has a makeshift bandage around their head. They look up hopefully. "Are you here to get us out?"');
                    } else {
                        e.showMessage('The right cells are open. Crew members have already filed out.');
                    }
                }
            },
            {
                name: 'Cell Control Panel',
                x: 148, y: 238, w: 38, h: 64,
                description: 'The magnetic lock control panel for the left cell block.',
                look: (e) => e.showMessage('A cell control terminal. The lock status indicator glows red. It requires authorised clearance — probably a magnetic badge or security override.'),
                use: (e) => {
                    if (e.getFlag('brig_cells_open')) {
                        e.showMessage('The cells are already unlocked.');
                    } else {
                        e.showMessage('The panel requires a magnetic access credential. Brute-forcing this would set off every alarm on the ship.');
                    }
                },
                useItem: (e, id) => {
                    if (id === 'prisoner_badge' && !e.getFlag('brig_cells_open')) {
                        releasePrisoners(e, id, '"THANK YOU!" Jorv Vance clasps your hand. "Pipz — she\'s alive?" You nod. The big man blinks away tears. "Lead us out of here. Please."');
                    } else {
                        e.showMessage(e.getFlag('brig_cells_open') ? 'The cells are already unlocked.' : 'That doesn\'t interface with this control panel.');
                    }
                }
            },
            {
                name: 'Badge Reader',
                x: 368, y: 158, w: 32, h: 54,
                description: 'A magnetic badge reader controlling all cells on this block.',
                look: (e) => e.showMessage('A magnetic badge reader. Swipe an authorised access card to release all cell locks simultaneously.'),
                useItem: (e, id) => {
                    if (id === 'prisoner_badge' && !e.getFlag('brig_cells_open')) {
                        releasePrisoners(e, id, '"THANK YOU!" Jorv Vance grasps your hand. "Pipz — she got away?" You nod. The big man\'s shoulders sag with relief. "Let\'s get off this ship."');
                    } else if (e.getFlag('brig_cells_open')) {
                        e.showMessage('Cells already released.');
                    } else {
                        e.showMessage('Nothing happens. Wrong authorisation level.');
                    }
                }
            },
            {
                name: 'Main Deck Exit',
                x: 278, y: 98, w: 84, h: 174, isExit: true, walkToX: 320, walkToY: 340,
                description: 'The hatch back to the main deck of the Draknoid flagship.',
                look: (e) => e.showMessage('The corridor hatch back to the main deck. Getting back without running into more guards will be tricky.'),
                onExit: (e) => e.goToRoom('draknoid_ship', 200, 310)
            }
        ]
    });

    function finalVictoryMessage(e) {
        // The console can also be spoofed without the cartridge; that route earns
        // its own sign-off so the harder solve is acknowledged.
        const improvised = e.getFlag('field_bypassed_without_cartridge')
            ? ' You never did find the specs the console wanted, so you lied to it with a freight manifest and a stolen radio cadence, which is the most janitorial solution imaginable.'
            : '';
        if (e.getFlag('rescued_prisoners')) {
            return 'You grab the Quantum Drive and run for the airlock! The freed prisoners are already aboard your shuttle, which is now both a getaway craft and a serious fire-code violation. After the jump, Jorv and Mella reunite with Pipz at Kerona Docking Bay.' + improvised + ' From humble janitor to galactic hero... and, annoyingly, still the person everyone expects to clean up afterward. THE END.';
        }
        return 'You grab the Quantum Drive and run for the airlock! Behind you, alarms blare as the Draknoids realize what\'s happened. You sprint through the corridors, leap into your shuttle, and blast away just as the flagship turns to pursue. But it\'s too late — you jump to hyperspace with the Quantum Drive safely aboard.' + improvised + ' From humble janitor to galactic hero... the galaxy owes its future to one unlikely sanitation engineer. THE END.';
    }

    // ========== ROOM 10: DRAKNOID SHIP ==========
    engine.registerRoom({
        id: 'draknoid_ship',
        transition: 'iris',
        hint: (e) => {
            if (!e.getFlag('guard_defeated')) return 'Use the Pulsar Ray on the guard. Stand back. Way back.';
            if (!e.getFlag('guard_anim_done')) return 'Wait for the dust to settle. The guard is still arguing with physics.';
            if (!e.getFlag('field_down') && e.hasItem('cartridge')) return 'The console wants Quantum Drive specs. Use the data cartridge on it.';
            if (!e.getFlag('field_down') && e.getFlag('rescued_prisoners') && e.hasItem('cargo_manifest') && e.hasItem('frequency_chip')) return 'No specs? Pair the freighter manifest and frequency chip with the prisoners\' knowledge at the console.';
            if (!e.getFlag('field_down')) return 'Without the drive specs, the console needs ship records, a signal source, and knowledge of Draknoid detention traffic.';
            return 'Grab the Quantum Drive. Run.';
        },
        name: 'Draknoid Flagship',
        description: 'You\'ve infiltrated the Draknoid flagship. A massive chamber houses the stolen Quantum Drive prototype, protected by a shimmering force field. A Draknoid guard stands watch.',
        onEnter: (e) => {
            e.sound.startAmbient('draknoid_ship');
            // Sierra pseudo-3D: deck plate begins at y=280 under the platform.
            e.setDepthScaling(286, 380, 0.72, 1.05);
            // AGI-inspired barriers: central platform, guard (when alive)
            e.addBarrier(240, 280, 160, 10);   // Central platform base
            if (!e.getFlag('guard_defeated')) {
                e.addBarrier(90, 280, 70, 15); // Guard body blocks passage
            }

            // Foreground layer: platform surface draws over player walking behind
            e.addForegroundLayer(285, (ctx) => {
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(248, 280, 145, 3);
            });

            // Edge transitions — ship is a dead end, only airlock exit to the left
            e.setEdgeTransition('right', (eng) => {
                eng.showMessage('The corridor leads deeper into the ship — swarming with Draknoids. Going that way alone would be suicide.');
            });
        },
        onUpdate: (e) => {
            if (e.getFlag('flew_unarmed') && !e.getFlag('unarmed_arrival_notice')) {
                e.setFlag('unarmed_arrival_notice');
                e.showMessage('You arrive at the Draknoid flagship without a weapon. The only thing aboard scarier than a Draknoid is a Draknoid who cannot believe what he is seeing.');
            }
            // Set guard_anim_done flag once the 7.5s defeat animation finishes
            const shootStart = e.getFlag('guard_shoot_start');
            if (shootStart && !e.getFlag('guard_anim_done') && e.animTimer - shootStart >= 7500) {
                e.setFlag('guard_anim_done');
                e.showMessage('The guard collapses in a heap of sparking armor. The path to the console is clear!');
            }
        },
        draw: (ctx, w, h, eng) => {
            // Dark alien chamber with quieter wall fields and a cyan focal bay.
            ctx.fillStyle = '#040b08';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#123d29';
            ctx.fillRect(42, 36, 556, 244);
            ditherRect(ctx, 62, 48, 516, 22, '#0b2519', '#246842', 5);
            ctx.fillStyle = '#12271c';
            ctx.beginPath();
            ctx.moveTo(0, 18); ctx.lineTo(42, 36); ctx.lineTo(82, 280); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(w, 18); ctx.lineTo(598, 36); ctx.lineTo(558, 280); ctx.lineTo(w, 400);
            ctx.closePath(); ctx.fill();

            // Ceiling
            ctx.fillStyle = '#0c180c';
            ctx.fillRect(0, 0, w, 20);
            // Green light strips
            ctx.fillStyle = '#115511';
            ctx.fillRect(100, 8, 180, 4);
            ctx.fillRect(360, 8, 180, 4);
            const stripGlow = Math.sin(eng.animTimer / 700) * 0.3 + 0.5;
            ctx.fillStyle = `rgba(30,200,30,${stripGlow * 0.15})`;
            ctx.fillRect(100, 0, 180, 20);
            ctx.fillRect(360, 0, 180, 20);

            perspectiveFloor(ctx, 280, w, h, '#0b1813', '#214637');

            // Walls
            ctx.fillStyle = '#0c1a0c';
            ctx.fillRect(0, 20, 20, 260);
            ctx.fillRect(620, 20, 20, 260);
            // Wall tech details
            ctx.fillStyle = '#183018';
            for (let y = 40; y < 270; y += 35) {
                ctx.fillRect(3, y, 14, 25);
                ctx.fillRect(623, y, 14, 25);
            }

            // Central platform with Quantum Drive
            ctx.fillStyle = '#24443d';
            ctx.fillRect(240, 250, 160, 30);
            ctx.fillStyle = '#3d7267';
            ctx.fillRect(250, 245, 140, 8);

            // Quantum Drive device
            ctx.fillStyle = '#445566';
            ctx.fillRect(285, 160, 70, 85);
            ctx.fillStyle = '#556677';
            ctx.fillRect(290, 165, 60, 75);
            // Core
            const coreGlow = Math.sin(eng.animTimer / 300) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(100,200,255,${coreGlow})`;
            ctx.fillRect(305, 185, 30, 30);
            ctx.fillStyle = `rgba(150,220,255,${coreGlow * 0.7})`;
            ctx.fillRect(310, 190, 20, 20);
            // Label
            ctx.fillStyle = '#AACCFF';
            ctx.font = sceneFont(8);
            ctx.fillText('QD PROTO', 292, 230);
            ctx.fillText('v3.1', 303, 240);

            // Force field
            if (!eng.getFlag('field_down')) {
                const ffAlpha = 0.2 + Math.sin(eng.animTimer / 400) * 0.1;
                ctx.fillStyle = `rgba(60,210,255,${ffAlpha})`;
                ctx.fillRect(260, 100, 120, 180);
                // Field lines
                ctx.strokeStyle = `rgba(120,235,255,${ffAlpha + 0.1})`;
                ctx.lineWidth = 1;
                for (let fy = 105; fy < 280; fy += 15) {
                    ctx.beginPath();
                    ctx.moveTo(260, fy);
                    ctx.lineTo(380, fy);
                    ctx.stroke();
                }
                // Field generators
                ctx.fillStyle = '#d09432';
                ctx.fillRect(255, 95, 8, 12);
                ctx.fillRect(377, 95, 8, 12);
                ctx.fillRect(255, 275, 8, 12);
                ctx.fillRect(377, 275, 8, 12);
            }

            // Console (right side)
            ctx.fillStyle = '#1a2e1a';
            ctx.fillRect(460, 150, 100, 100);
            ctx.fillStyle = '#0d1e0d';
            ctx.fillRect(465, 155, 90, 60);
            // Console screen
            if (!eng.getFlag('field_down')) {
                ctx.fillStyle = '#002200';
                ctx.fillRect(470, 160, 80, 45);
                ctx.fillStyle = '#00AA00';
                ctx.font = '8px "Courier New"';
                ctx.fillText('FORCE FIELD', 475, 175);
                ctx.fillText('STATUS: ACTIVE', 475, 188);
                ctx.fillText('DATA PORT: READY', 475, 201);
            } else {
                ctx.fillStyle = '#220000';
                ctx.fillRect(470, 160, 80, 45);
                ctx.fillStyle = '#FF4444';
                ctx.font = '8px "Courier New"';
                ctx.fillText('FORCE FIELD', 475, 175);
                ctx.fillText('STATUS: OFFLINE', 475, 188);
                ctx.fillText('** OVERRIDE **', 475, 201);
            }
            // Console buttons
            ctx.fillStyle = '#22AA22';
            ctx.fillRect(470, 220, 8, 8);
            ctx.fillStyle = '#AA2222';
            ctx.fillRect(485, 220, 8, 8);
            ctx.fillStyle = '#AAAA22';
            ctx.fillRect(500, 220, 8, 8);
            // Data slot
            ctx.fillStyle = '#444455';
            ctx.fillRect(520, 220, 20, 10);

            // Draknoid Guard - with in-room Monty Python style defeat animation
            const guardShootStart = eng.getFlag('guard_shoot_start');
            const guardT = guardShootStart ? eng.animTimer - guardShootStart : -1;
            const guardAnimActive = guardT >= 0 && guardT < 7500;
            const gx = 120; // guard center x

            if (guardAnimActive) {
                // ---- ANIMATED SHOOTING SEQUENCE (Black Knight style) ----
                const BOLT_END = 500, IMPACT_END = 800;
                const ARM1_POP = 800, ARM1_LAND = 1600;
                const SPEECH1_START = 1600, SPEECH1_END = 3000;
                const ARM2_POP = 3000, ARM2_LAND = 3800;
                const SPEECH2_START = 3800, SPEECH2_END = 5200;
                const WOBBLE_START = 5200, FALL_START = 5800, FALL_END = 6500;

                const rightArmOff = guardT >= ARM1_POP;
                const leftArmOff = guardT >= ARM2_POP;

                // Body tilt for wobble and fall
                let bodyTilt = 0;
                if (guardT >= WOBBLE_START && guardT < FALL_START) {
                    const wp = (guardT - WOBBLE_START) / (FALL_START - WOBBLE_START);
                    bodyTilt = Math.sin(wp * Math.PI * 6) * 0.12 * (1 + wp);
                } else if (guardT >= FALL_START) {
                    const fp = Math.min((guardT - FALL_START) / (FALL_END - FALL_START), 1);
                    bodyTilt = 0.12 + fp * (Math.PI * 0.42);
                    if (fp >= 1 && guardT < FALL_END + 200) {
                        bodyTilt -= 0.06 * Math.sin((guardT - FALL_END) / 200 * Math.PI);
                    }
                }

                // Guard body (with rotation for wobble/fall)
                ctx.save();
                if (bodyTilt !== 0) {
                    ctx.translate(gx, 292);
                    ctx.rotate(bodyTilt);
                    ctx.translate(-gx, -292);
                }
                // Body
                ctx.fillStyle = '#114411';
                ctx.fillRect(95, 160, 50, 90);
                // Armor chest plate
                ctx.fillStyle = '#226622';
                ctx.fillRect(100, 165, 40, 30);
                ctx.fillStyle = '#2a7a2a';
                ctx.fillRect(102, 168, 36, 8);
                ctx.fillRect(102, 179, 36, 8);
                // Emblem
                ctx.fillStyle = '#33AA33';
                ctx.fillRect(115, 170, 10, 6);
                // Impact scorch mark on chest
                if (guardT >= IMPACT_END) {
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(112, 172, 16, 12);
                    ctx.fillStyle = '#2a1a00';
                    ctx.fillRect(114, 174, 12, 8);
                }
                // Belt
                ctx.fillStyle = '#337733';
                ctx.fillRect(97, 205, 46, 6);
                // Shoulders (sparking stubs where arms detached)
                ctx.fillStyle = '#1a5a1a';
                if (!leftArmOff) {
                    ctx.fillRect(85, 155, 18, 18);
                    ctx.fillStyle = '#228822';
                    ctx.fillRect(88, 151, 4, 6);
                    ctx.fillRect(97, 151, 4, 6);
                } else {
                    ctx.fillRect(88, 160, 12, 12);
                    if (Math.floor(guardT / 100) % 3 === 0) {
                        ctx.fillStyle = '#ff8';
                        ctx.fillRect(87 + (guardT % 10), 162, 3, 3);
                    }
                }
                ctx.fillStyle = '#1a5a1a';
                if (!rightArmOff) {
                    ctx.fillRect(137, 155, 18, 18);
                    ctx.fillStyle = '#228822';
                    ctx.fillRect(140, 151, 4, 6);
                    ctx.fillRect(149, 151, 4, 6);
                } else {
                    ctx.fillRect(140, 160, 12, 12);
                    if (Math.floor(guardT / 100) % 3 === 1) {
                        ctx.fillStyle = '#ff8';
                        ctx.fillRect(143 + (guardT % 8), 162, 3, 3);
                    }
                }
                // Head
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(103, 125, 35, 35);
                ctx.fillStyle = '#1a4a1a';
                ctx.fillRect(108, 135, 3, 3);
                ctx.fillRect(120, 130, 3, 3);
                ctx.fillRect(130, 138, 3, 3);
                // Helmet
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(100, 118, 40, 18);
                ctx.fillStyle = '#225522';
                ctx.fillRect(115, 112, 10, 8);
                // Visor - expression changes through phases
                let visorColor = '#f22';
                if (rightArmOff && !leftArmOff) {
                    visorColor = '#ff8800'; // surprised/confused
                } else if (leftArmOff && guardT < FALL_START) {
                    visorColor = Math.floor(guardT / 120) % 2 ? '#ff0000' : '#ff4400'; // angry flash
                } else if (guardT >= FALL_START) {
                    const dimP = Math.min((guardT - FALL_START) / (FALL_END - FALL_START), 1);
                    const v = Math.floor(255 * (1 - dimP * 0.7));
                    visorColor = `rgb(${v},${Math.floor(v * 0.13)},${Math.floor(v * 0.13)})`;
                }
                ctx.fillStyle = visorColor;
                // Head/visor turns to look at missing arm
                if (rightArmOff && !leftArmOff && guardT < ARM2_POP) {
                    // Looking right at where arm was
                    ctx.fillRect(118, 138, 22, 6);
                    ctx.fillStyle = '#2a5a2a';
                    ctx.fillRect(108, 138, 8, 6);
                } else if (leftArmOff && guardT < WOBBLE_START) {
                    // Looking left at other missing arm
                    ctx.fillRect(102, 138, 22, 6);
                    ctx.fillStyle = '#2a5a2a';
                    ctx.fillRect(128, 138, 8, 6);
                } else {
                    ctx.fillRect(108, 138, 25, 6);
                    // Visor segments
                    const segAlpha = guardT < FALL_START ? 0.8 : 0.3;
                    ctx.fillStyle = `rgba(255,80,80,${segAlpha})`;
                    ctx.fillRect(110, 139, 6, 4);
                    ctx.fillRect(118, 139, 6, 4);
                    ctx.fillRect(126, 139, 6, 4);
                }
                // Jaw/mandible - open mouth when yelling
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(108, 148, 25, 10);
                ctx.fillStyle = '#1a4a1a';
                ctx.fillRect(112, 154, 4, 4);
                ctx.fillRect(124, 154, 4, 4);
                if (rightArmOff || leftArmOff) {
                    // Mouth open in surprise/rage
                    ctx.fillStyle = '#0a1a0a';
                    ctx.fillRect(114, 150, 12, 8);
                    // Fangs more visible
                    ctx.fillStyle = '#aabb99';
                    ctx.fillRect(115, 150, 3, 4);
                    ctx.fillRect(123, 150, 3, 4);
                }
                // Left arm (if still attached)
                if (!leftArmOff) {
                    ctx.fillStyle = '#114411';
                    ctx.fillRect(80, 170, 15, 50);
                    ctx.fillStyle = '#1a5a1a';
                    ctx.fillRect(80, 180, 15, 5);
                    ctx.fillRect(80, 200, 15, 5);
                    ctx.fillStyle = '#226622';
                    ctx.fillRect(78, 215, 18, 10);
                }
                // Right arm + weapon (if still attached)
                if (!rightArmOff) {
                    ctx.fillStyle = '#114411';
                    ctx.fillRect(145, 170, 15, 50);
                    ctx.fillStyle = '#1a5a1a';
                    ctx.fillRect(145, 180, 15, 5);
                    ctx.fillRect(145, 200, 15, 5);
                    ctx.fillStyle = '#226622';
                    ctx.fillRect(143, 215, 18, 10);
                    ctx.fillStyle = '#333344';
                    ctx.fillRect(148, 162, 10, 65);
                }
                // Legs
                ctx.fillStyle = '#0e3a0e';
                ctx.fillRect(100, 250, 18, 35);
                ctx.fillRect(125, 250, 18, 35);
                ctx.fillStyle = '#1a5a1a';
                ctx.fillRect(98, 250, 22, 8);
                ctx.fillRect(123, 250, 22, 8);
                ctx.fillStyle = '#0a2a0a';
                ctx.fillRect(97, 280, 24, 12);
                ctx.fillRect(122, 280, 24, 12);
                // Legs scramble during wobble/fall
                if (guardT >= WOBBLE_START && guardT < FALL_END) {
                    const legKick = Math.sin(guardT / 60) * 6;
                    ctx.fillStyle = '#0a2a0a';
                    ctx.fillRect(97 + legKick, 282, 24, 10);
                    ctx.fillRect(122 - legKick, 282, 24, 10);
                }
                ctx.restore();

                // ---- DETACHED RIGHT ARM (with weapon still gripped) ----
                if (rightArmOff) {
                    const armP = Math.min((guardT - ARM1_POP) / (ARM1_LAND - ARM1_POP), 1);
                    let ax, ay, ar;
                    if (armP < 1) {
                        ax = 155 + armP * 80;
                        ay = 170 - armP * 130 + armP * armP * 210;
                        ar = armP * Math.PI * 3;
                    } else {
                        const bp = Math.min((guardT - ARM1_LAND) / 200, 1);
                        ax = 235;
                        ay = 275 - (1 - bp) * 8 * Math.sin(bp * Math.PI);
                        ar = Math.PI * 3;
                    }
                    ctx.save();
                    ctx.translate(ax, ay);
                    ctx.rotate(ar);
                    ctx.fillStyle = '#114411';
                    ctx.fillRect(-7, -22, 15, 44);
                    ctx.fillStyle = '#1a5a1a';
                    ctx.fillRect(-7, -12, 15, 5);
                    ctx.fillStyle = '#226622';
                    ctx.fillRect(-9, 18, 18, 8);
                    ctx.fillStyle = '#333344';
                    ctx.fillRect(-3, -28, 8, 50);
                    ctx.restore();
                    // Detach pop particles
                    if (guardT - ARM1_POP < 350) {
                        const pp = (guardT - ARM1_POP) / 350;
                        for (let i = 0; i < 8; i++) {
                            const ang = (i / 8) * Math.PI * 2;
                            const dist = pp * 28;
                            ctx.fillStyle = `rgba(255,200,50,${1 - pp})`;
                            ctx.fillRect(155 + Math.cos(ang) * dist, 185 + Math.sin(ang) * dist, 3, 3);
                        }
                        // Comical "POP!" text
                        if (pp < 0.6) {
                            ctx.fillStyle = `rgba(255,255,100,${1 - pp / 0.6})`;
                            ctx.font = '12px "Courier New"';
                            ctx.fillText('POP!', 165, 165 - pp * 20);
                        }
                    }
                }

                // ---- DETACHED LEFT ARM ----
                if (leftArmOff) {
                    const armP = Math.min((guardT - ARM2_POP) / (ARM2_LAND - ARM2_POP), 1);
                    let ax, ay, ar;
                    if (armP < 1) {
                        ax = 85 - armP * 55;
                        ay = 170 - armP * 110 + armP * armP * 190;
                        ar = -armP * Math.PI * 4;
                    } else {
                        const bp = Math.min((guardT - ARM2_LAND) / 200, 1);
                        ax = 30;
                        ay = 272 - (1 - bp) * 6 * Math.sin(bp * Math.PI);
                        ar = -Math.PI * 4;
                    }
                    ctx.save();
                    ctx.translate(ax, ay);
                    ctx.rotate(ar);
                    ctx.fillStyle = '#114411';
                    ctx.fillRect(-7, -22, 15, 44);
                    ctx.fillStyle = '#1a5a1a';
                    ctx.fillRect(-7, -12, 15, 5);
                    ctx.fillStyle = '#226622';
                    ctx.fillRect(-9, 18, 18, 8);
                    ctx.restore();
                    // Detach pop particles
                    if (guardT - ARM2_POP < 350) {
                        const pp = (guardT - ARM2_POP) / 350;
                        for (let i = 0; i < 8; i++) {
                            const ang = (i / 8) * Math.PI * 2;
                            const dist = pp * 28;
                            ctx.fillStyle = `rgba(255,200,50,${1 - pp})`;
                            ctx.fillRect(85 + Math.cos(ang) * dist, 185 + Math.sin(ang) * dist, 3, 3);
                        }
                        // Another comical sound effect
                        if (pp < 0.6) {
                            ctx.fillStyle = `rgba(255,255,100,${1 - pp / 0.6})`;
                            ctx.font = '12px "Courier New"';
                            ctx.fillText('CLONK!', 40, 165 - pp * 20);
                        }
                    }
                }

                // ---- BOLT EFFECT ----
                if (guardT < BOLT_END) {
                    const bp = guardT / BOLT_END;
                    const px = eng.getFlag('guard_shoot_px') || eng.playerX;
                    const boltX = px + 10 + bp * (gx - px - 10);
                    const boltY = 295 + bp * (185 - 295);
                    // Muzzle flash
                    if (bp < 0.25) {
                        ctx.fillStyle = '#ff8';
                        ctx.beginPath();
                        ctx.arc(px + 12, 295, 5 + (Math.sin(bp * 50) + 1) * 1.5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(px + 12, 295, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    // Energy bolt (AGI-style: solid halo instead of shadowBlur)
                    ctx.fillStyle = '#55FFFF';
                    ctx.fillRect(boltX - 12, boltY - 4, 24, 8);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(boltX - 10, boltY - 2, 20, 4);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(boltX - 6, boltY - 1, 12, 2);
                    // Trail
                    for (let i = 1; i < 4; i++) {
                        ctx.fillStyle = `rgba(100,180,255,${0.4 - i * 0.1})`;
                        ctx.fillRect(boltX + 10 + i * 10, boltY - 1, 8, 2);
                    }
                }

                // ---- IMPACT FLASH ----
                if (guardT >= BOLT_END && guardT < IMPACT_END) {
                    const ip = (guardT - BOLT_END) / (IMPACT_END - BOLT_END);
                    ctx.fillStyle = `rgba(100,200,255,${0.9 - ip * 0.9})`;
                    ctx.beginPath();
                    ctx.arc(gx, 185, 18 + ip * 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = `rgba(255,255,255,${0.7 - ip * 0.7})`;
                    ctx.beginPath();
                    ctx.arc(gx, 185, 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // ---- SPEECH BUBBLES ----
                if (guardT >= SPEECH1_START && guardT < SPEECH1_END) {
                    drawSpeechBubble(ctx, 210, 110, 'HONOR SYSTEM FAILURE!');
                }
                if (guardT >= SPEECH2_START && guardT < SPEECH2_END) {
                    drawSpeechBubble(ctx, 210, 110, 'AUTOMATED COWARDICE!');
                }

                // "COME BACK HERE!" as guard falls
                if (guardT >= FALL_START && guardT < FALL_END) {
                    const fallP = (guardT - FALL_START) / (FALL_END - FALL_START);
                    if (fallP < 0.5) {
                        drawSpeechBubble(ctx, 200, 100 + fallP * 40, 'I DID NOT AUTHORIZE THAT!');
                    }
                }

            } else if (eng.getFlag('guard_defeated')) {
                // Defeated guard - Monty Python aftermath: scattered parts
                // Torso lying on its side
                ctx.save();
                ctx.translate(115, 278);
                ctx.rotate(Math.PI * 0.42);
                ctx.fillStyle = '#114411';
                ctx.fillRect(-22, -40, 44, 75);
                ctx.fillStyle = '#226622';
                ctx.fillRect(-18, -36, 36, 25);
                // Scorch mark
                ctx.fillStyle = '#0a0a0a';
                ctx.fillRect(-8, -30, 14, 10);
                // Head still attached, visor dim
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(-15, -62, 30, 28);
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(-18, -68, 36, 14);
                ctx.fillStyle = '#330000';
                ctx.fillRect(-10, -48, 22, 5);
                // Open mouth (unconscious)
                ctx.fillStyle = '#0a1a0a';
                ctx.fillRect(-4, -38, 10, 6);
                ctx.restore();

                // Right arm + weapon (flung to the right)
                ctx.save();
                ctx.translate(225, 278);
                ctx.rotate(0.7);
                ctx.fillStyle = '#114411';
                ctx.fillRect(-6, -18, 13, 38);
                ctx.fillStyle = '#226622';
                ctx.fillRect(-8, 16, 16, 8);
                ctx.fillStyle = '#333344';
                ctx.fillRect(-2, -24, 7, 46);
                ctx.restore();

                // Left arm (flung to the left)
                ctx.save();
                ctx.translate(35, 275);
                ctx.rotate(-0.6);
                ctx.fillStyle = '#114411';
                ctx.fillRect(-6, -18, 13, 38);
                ctx.fillStyle = '#226622';
                ctx.fillRect(-8, 16, 16, 8);
                ctx.restore();

                // A boot that came off
                ctx.fillStyle = '#0a2a0a';
                ctx.fillRect(185, 284, 20, 10);
                ctx.fillStyle = '#071f07';
                ctx.fillRect(185, 290, 20, 4);

                // Pauldron spike rolled away
                ctx.fillStyle = '#228822';
                ctx.fillRect(260, 288, 5, 6);

            } else {
                // Normal standing guard - alive and menacing
                // Contact shadow grounds the guard on the chamber floor.
                eng.drawContactShadow(ctx, 121, 291, 1, { rx: 27, ry: 4.5, alpha: 0.3 });
                // The chamber is mono-green, so the guard was camouflaged against
                // his own ship. A framed sentry alcove behind him and a violet rim
                // light on his lit edge pull the silhouette off the wall.
                ctx.fillStyle = '#0e2a0e';
                ctx.fillRect(66, 100, 112, 194);
                ctx.fillStyle = '#1a4a1a';
                ctx.fillRect(66, 100, 112, 6);
                ctx.fillRect(66, 100, 6, 194);
                ctx.fillRect(172, 100, 6, 194);
                ctx.fillStyle = 'rgba(0,10,0,0.62)';
                ctx.fillRect(74, 106, 96, 188);
                ctx.fillStyle = '#33AA33';
                ctx.font = '7px "Courier New"';
                ctx.fillText('SENTRY 1', 74, 98);
                // Body - large, menacing
                ctx.fillStyle = '#114411';
                ctx.fillRect(95, 160, 50, 90);
                // Armor chest plate
                ctx.fillStyle = '#226622';
                ctx.fillRect(100, 165, 40, 30);
                ctx.fillStyle = '#2a7a2a';
                ctx.fillRect(102, 168, 36, 8);
                ctx.fillRect(102, 179, 36, 8);
                ctx.fillStyle = '#33AA33';
                ctx.fillRect(115, 170, 10, 6);
                ctx.fillStyle = '#44CC44';
                ctx.fillRect(117, 171, 6, 4);
                ctx.fillStyle = '#226622';
                ctx.fillRect(100, 210, 40, 15);
                ctx.fillStyle = '#337733';
                ctx.fillRect(97, 205, 46, 6);
                ctx.fillStyle = '#44AA44';
                ctx.fillRect(105, 206, 3, 4);
                ctx.fillRect(115, 206, 3, 4);
                ctx.fillRect(125, 206, 3, 4);
                ctx.fillRect(135, 206, 3, 4);
                ctx.fillStyle = '#1a5a1a';
                ctx.fillRect(85, 155, 18, 18);
                ctx.fillRect(137, 155, 18, 18);
                ctx.fillStyle = '#228822';
                ctx.fillRect(88, 151, 4, 6);
                ctx.fillRect(97, 151, 4, 6);
                ctx.fillRect(140, 151, 4, 6);
                ctx.fillRect(149, 151, 4, 6);
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(103, 125, 35, 35);
                ctx.fillStyle = '#1a4a1a';
                ctx.fillRect(108, 135, 3, 3);
                ctx.fillRect(120, 130, 3, 3);
                ctx.fillRect(130, 138, 3, 3);
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(100, 118, 40, 18);
                ctx.fillStyle = '#225522';
                ctx.fillRect(115, 112, 10, 8);
                const visorGlow = 0.7 + Math.sin(eng.animTimer / 600) * 0.3;
                ctx.fillStyle = `rgba(255,34,34,${visorGlow})`;
                ctx.fillRect(108, 138, 25, 6);
                ctx.fillStyle = `rgba(255,80,80,${visorGlow * 0.8})`;
                ctx.fillRect(110, 139, 6, 4);
                ctx.fillRect(118, 139, 6, 4);
                ctx.fillRect(126, 139, 6, 4);
                ctx.fillStyle = '#2a5a2a';
                ctx.fillRect(108, 148, 25, 10);
                ctx.fillStyle = '#1a4a1a';
                ctx.fillRect(112, 154, 4, 4);
                ctx.fillRect(124, 154, 4, 4);
                ctx.fillStyle = '#114411';
                ctx.fillRect(80, 170, 15, 50);
                ctx.fillRect(145, 170, 15, 50);
                ctx.fillStyle = '#1a5a1a';
                ctx.fillRect(80, 180, 15, 5);
                ctx.fillRect(145, 180, 15, 5);
                ctx.fillRect(80, 200, 15, 5);
                ctx.fillRect(145, 200, 15, 5);
                ctx.fillStyle = '#226622';
                ctx.fillRect(78, 215, 18, 10);
                ctx.fillRect(143, 215, 18, 10);
                ctx.fillStyle = '#333344';
                ctx.fillRect(148, 162, 10, 65);
                ctx.fillStyle = '#444455';
                ctx.fillRect(146, 158, 14, 10);
                ctx.fillStyle = '#555566';
                ctx.fillRect(150, 155, 6, 8);
                const wepGlow = 0.5 + Math.sin(eng.animTimer / 400) * 0.3;
                ctx.fillStyle = `rgba(80,255,80,${wepGlow * 0.4})`;
                ctx.fillRect(149, 155, 8, 4);
                ctx.fillStyle = '#2a2a3a';
                ctx.fillRect(149, 220, 8, 10);
                ctx.fillStyle = '#0e3a0e';
                ctx.fillRect(100, 250, 18, 35);
                ctx.fillRect(125, 250, 18, 35);
                ctx.fillStyle = '#1a5a1a';
                ctx.fillRect(98, 250, 22, 8);
                ctx.fillRect(123, 250, 22, 8);
                ctx.fillStyle = '#174417';
                ctx.fillRect(102, 265, 14, 15);
                ctx.fillRect(127, 265, 14, 15);
                ctx.fillStyle = '#0a2a0a';
                ctx.fillRect(97, 280, 24, 12);
                ctx.fillRect(122, 280, 24, 12);
                ctx.fillStyle = '#071f07';
                ctx.fillRect(97, 288, 24, 4);
                ctx.fillRect(122, 288, 24, 4);
                ctx.fillStyle = '#444444';
                ctx.fillRect(95, 285, 3, 4);
                ctx.fillRect(146, 285, 3, 4);
                // Violet rim light down the near edge, plus a warm catch on the
                // helmet crest — the only non-green in the room, by design.
                ctx.fillStyle = '#B45CE0';
                ctx.fillRect(93, 160, 2, 90);
                ctx.fillRect(78, 170, 2, 45);
                ctx.fillRect(101, 125, 2, 35);
                ctx.fillRect(98, 118, 2, 18);
                ctx.fillRect(98, 250, 2, 35);
                ctx.fillStyle = '#E0A0FF';
                ctx.fillRect(100, 116, 40, 2);
                ctx.fillRect(113, 110, 12, 2);
                ctx.fillStyle = '#6A2A90';
                ctx.fillRect(160, 170, 2, 45);
                ctx.fillRect(145, 160, 2, 90);
            }

            // Exit / airlock (left)
            ctx.fillStyle = '#1a301a';
            ctx.fillRect(0, 80, 30, 180);
            ctx.fillStyle = '#225522';
            ctx.fillRect(4, 85, 22, 170);
            ctx.fillStyle = '#339933';
            ctx.font = '8px "Courier New"';
            ctx.fillText('AIR', 7, 170);
            ctx.fillText('LOCK', 6, 180);

            // Alien pipes along ceiling
            ctx.fillStyle = '#0e2e0e';
            ctx.fillRect(20, 14, 600, 5);
            ctx.fillStyle = '#1a4a1a';
            ctx.fillRect(150, 12, 8, 9);
            ctx.fillRect(350, 12, 8, 9);
            ctx.fillRect(500, 12, 8, 9);
            // Steam/gas leak from pipe
            const steamAlpha = 0.3 + Math.sin(eng.animTimer / 500) * 0.15;
            ctx.fillStyle = `rgba(30,100,30,${steamAlpha * 0.3})`;
            ctx.fillRect(345, 19, 18, 15);

            // Wall screens (left wall)
            ctx.fillStyle = '#0a2a0a';
            ctx.fillRect(5, 50, 14, 20);
            const wallScreenGlow = Math.sin(eng.animTimer / 800) * 0.3 + 0.5;
            ctx.fillStyle = `rgba(30,150,30,${wallScreenGlow * 0.4})`;
            ctx.fillRect(6, 51, 12, 18);
            // Scrolling alien text on wall screen
            ctx.fillStyle = `rgba(50,200,50,${wallScreenGlow * 0.6})`;
            ctx.font = '4px "Courier New"';
            const alienChars = '⌂◊∆≡≈∞';
            const scrollOffset = Math.floor(eng.animTimer / 300) % alienChars.length;
            ctx.fillText(alienChars.substring(scrollOffset, scrollOffset + 3), 7, 62);

            // Draknoid war trophies on right wall
            ctx.fillStyle = '#2a2a3a';
            ctx.fillRect(625, 50, 13, 30);
            ctx.fillStyle = '#4444AA';
            ctx.fillRect(628, 55, 7, 5); // captured badge
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(628, 65, 7, 10); // flag/pennant

            // Floor damage/burn marks
            ctx.fillStyle = 'rgba(20,50,20,0.3)';
            ctx.fillRect(180, 300, 30, 15);
            ctx.fillRect(400, 310, 20, 12);

            // Draknoid insignia on floor (center)
            ctx.strokeStyle = 'rgba(40,120,40,0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(320, 340, 30, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(40,120,40,0.1)';
            ctx.beginPath(); ctx.arc(320, 340, 20, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(40,120,40,0.08)';
            ctx.fillRect(310, 330, 20, 20);
            ctx.lineWidth = 1;

            // Ambient green particle effects
            const partTime = eng.animTimer / 500;
            ctx.fillStyle = 'rgba(50,200,50,0.15)';
            for (let p = 0; p < 4; p++) {
                const px = 100 + (p * 150) + Math.sin(partTime + p * 2) * 10;
                const py = 30 + Math.cos(partTime + p * 3) * 15;
                ctx.fillRect(px, py, 2, 2);
            }

            // Brig corridor — right wall passage
            ctx.fillStyle = '#0a1a0a';
            ctx.fillRect(610, 75, 30, 195);
            // Frame
            ctx.fillStyle = '#2a4a2a';
            ctx.fillRect(607, 72, 5, 200);
            ctx.fillRect(607, 72, 35, 5);
            // Eerie dim light from brig
            ctx.fillStyle = 'rgba(0,80,0,0.15)';
            ctx.beginPath(); ctx.arc(620, 170, 30, 0, Math.PI * 2); ctx.fill();
            // Sign
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#446644';
            ctx.save(); ctx.translate(638, 270); ctx.rotate(-Math.PI / 2);
            ctx.fillText('DETENTION', 0, 0); ctx.restore();
        },
        hotspots: [
            {
                name: 'Draknoid Guard', x: 78, y: 115, w: 90, h: 180,
                description: 'A heavily armored Draknoid guard.',
                look: (e) => {
                    if (e.getFlag('guard_defeated') && !e.getFlag('guard_anim_done')) {
                        e.showMessage('You wait for the dust to settle. The Draknoid is still busy disagreeing with physics.');
                    } else if (e.getFlag('guard_defeated')) {
                        e.showMessage('The Draknoid guard lies in several pieces on the floor. His arms are... elsewhere. Apparently Draknoid warriors aren\'t built as tough as they look.');
                    } else {
                        e.showMessage('A Draknoid warrior blocks the way, all armor, visor, and plasma rifle. He looks allergic to janitors.');
                    }
                },
                walk: (e) => {
                    if (e.getFlag('guard_defeated') && !e.getFlag('guard_anim_done')) {
                        e.showMessage('You wait for the dust to settle before stepping anywhere near him.');
                    } else if (e.getFlag('guard_defeated')) {
                        e.showMessage('You step over the smouldering remains of the guard. Best not to look too closely.');
                    } else {
                        e.die('You try to sneak past the Draknoid guard. Bad idea. He spots you instantly and opens fire with his plasma rifle. You should have found a weapon first.');
                    }
                },
                talk: (e) => {
                    if (e.getFlag('guard_defeated') && !e.getFlag('guard_anim_done')) {
                        e.showMessage('He is, at this exact moment, busy. You should let the cinematic finish.');
                    } else if (e.getFlag('guard_defeated')) {
                        e.showMessage('His torso is over there, his arms are over HERE... this conversation is going nowhere.');
                    } else {
                        e.showMessage('"HALT! ONE MORE STEP AND I VAPORIZE YOU!" He appears to mean the unfriendly kind of vaporize.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('guard_defeated') && e.hasItem('pulsar_ray')) {
                        engine.sound.laser();
                        e.showMessage('You quick-draw the Pulsar Ray and fire! ZZAP! Direct hit to the chest armor! Wait... is his arm supposed to do that?');
                        e.setFlag('guard_defeated');
                        e.setFlag('guard_shoot_start', engine.animTimer);
                        e.setFlag('guard_shoot_px', e.playerX);
                        e.addScore(25);
                    } else if (e.getFlag('guard_defeated')) {
                        e.showMessage('He\'s already in pieces. Literally.');
                    } else {
                        e.showMessage('You need a weapon first!');
                    }
                },
                useItem: (e, itemId) => {
                    if (itemId === 'pulsar_ray' && !e.getFlag('guard_defeated')) {
                        engine.sound.laser();
                        e.showMessage('You quick-draw the Pulsar Ray and fire! ZZAP! Direct hit! The guard looks down at the smoking hole in his armor, then back at you. This should be entertaining...');
                        e.setFlag('guard_defeated');
                        e.setFlag('guard_shoot_start', engine.animTimer);
                        e.setFlag('guard_shoot_px', e.playerX);
                        e.addScore(25);
                    } else if (e.getFlag('guard_defeated')) {
                        e.showMessage('The guard is already in several pieces. No need for more.');
                    } else {
                        e.showMessage('That won\'t work against an armored Draknoid warrior.');
                    }
                }
            },
            {
                name: 'Console', x: 455, y: 145, w: 110, h: 100,
                description: 'A Draknoid computer console.',
                look: (e) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('You can\'t get a good look with that guard pointing a gun at you.');
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('The console shows "FORCE FIELD OFFLINE". The data cartridge is still plugged in.');
                    } else {
                        e.showMessage('A Draknoid console. FORCE FIELD: ACTIVE. DATA PORT: READY. It wants technical specs, not moral support.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('Deal with the guard first!');
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('The force field is already down.');
                    } else if (e.hasItem('cartridge')) {
                        e.showMessage('You insert the Quantum Drive cartridge. The system accepts the specs, the field drops, and for once your plan survives contact with a computer.');
                        e.removeFromInventory('cartridge');
                        e.setFlag('field_down');
                        e.addScore(25);
                    } else if (e.getFlag('rescued_prisoners') && e.hasItem('cargo_manifest') && e.hasItem('frequency_chip')) {
                        e.showMessage('You cross-load the freighter manifest through the frequency chip and add the prisoners\' overheard access cadence. The console mistakes it for a Draknoid maintenance burst and drops the field. Sloppy, desperate, effective.');
                        e.setFlag('field_down');
                        e.setFlag('field_bypassed_without_cartridge');
                        e.addScore(5);
                    } else {
                        e.showMessage('The console wants Quantum Drive specs. Without them, you\'ll need an ugly workaround involving ship records, a signal source, and someone who has heard Draknoid detention traffic up close.');
                    }
                },
                useItem: (e, itemId) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('The guard won\'t let you near the console!');
                    } else if (itemId === 'cartridge' && !e.getFlag('field_down')) {
                        e.showMessage('You slot in the cartridge. The console accepts the specs and drops the field. Brilliant, or at least adequately labeled.');
                        e.removeFromInventory('cartridge');
                        e.setFlag('field_down');
                        e.addScore(25);
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('Force field is already offline.');
                    } else if ((itemId === 'cargo_manifest' || itemId === 'frequency_chip') && e.getFlag('rescued_prisoners') && e.hasItem('cargo_manifest') && e.hasItem('frequency_chip')) {
                        e.showMessage('You pair the manifest with the frequency chip and the prisoners\' stolen access cadence, spoofing a maintenance burst. Somewhere, an engineer wakes up angry and does not know why.');
                        e.setFlag('field_down');
                        e.setFlag('field_bypassed_without_cartridge');
                        e.addScore(5);
                    } else if (itemId === 'cargo_manifest') {
                        e.showMessage('The manifest has ship IDs, but no way to transmit them and no Draknoid access rhythm to hide inside. It needs more context.');
                    } else if (itemId === 'frequency_chip') {
                        e.showMessage('The chip can transmit, but it has nothing useful to say. It needs records and a believable Draknoid signal pattern.');
                    } else {
                        e.showMessage('The console doesn\'t accept that.');
                    }
                }
            },
            {
                name: 'Quantum Drive', x: 275, y: 150, w: 90, h: 110,
                description: 'The stolen Quantum Drive prototype!',
                look: (e) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('Through the force field shimmer, you can see the Quantum Drive prototype. Its core pulses with incredible energy. This is what they stole from the Constellation. But first — that guard.');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('The Quantum Drive sits just beyond the humming field. Close enough to admire, not close enough to steal.');
                    } else {
                        e.showMessage('The Quantum Drive prototype sits unprotected! Its core glows with mesmerizing blue energy. This is it — grab it and save the galaxy!');
                    }
                },
                get: (e) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('You can\'t get past the guard, let alone the force field!');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('ZAP! The force field shocks you as you reach for it. You need to disable the field first!');
                    } else if (!e.getFlag('grabbed_quantum_drive')) {
                        // VICTORY!
                        e.setFlag('grabbed_quantum_drive');
                        if (e.getFlag('rescued_prisoners')) e.setFlag('pipz_thanked');
                        e.addScore(20);
                        const victoryMsg = finalVictoryMessage(e);
                        e.playCutscene({
                            duration: 10000,
                            draw: cutsceneVictoryEscape,
                            onEnd: () => e.victory(victoryMsg),
                            skippable: true
                        });
                    }
                },
                use: (e) => {
                    if (!e.getFlag('guard_defeated')) {
                        e.showMessage('You can\'t get past the guard!');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('ZAP! The force field blocks you!');
                    } else if (!e.getFlag('grabbed_quantum_drive')) {
                        e.setFlag('grabbed_quantum_drive');
                        if (e.getFlag('rescued_prisoners')) e.setFlag('pipz_thanked');
                        e.addScore(20);
                        const victoryMsg = finalVictoryMessage(e);
                        e.playCutscene({
                            duration: 10000,
                            draw: cutsceneVictoryEscape,
                            onEnd: () => e.victory(victoryMsg),
                            skippable: true
                        });
                    }
                }
            },
            {
                name: 'Force Field', x: 255, y: 90, w: 135, h: 200,
                get hidden() { return engine.getFlag('field_down'); },
                description: 'A shimmering energy force field.',
                look: (e) => {
                    e.showMessage('A powerful force field surrounds the platform. It hums in the key of "do not touch."');
                },
                useItem: (e, id) => {
                    if (id === 'plasma_cutter') {
                        e.showMessage('The cutter spits sparks. The field remains professionally unimpressed.');
                    } else {
                        e.showMessage('That won\'t do anything to the force field. You need to find a way to shut it down from the ship\'s console.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('field_down')) {
                        const px = engine.playerX, py = engine.playerY;
                        const sc = engine.playerSpriteScale(py);
                        e.playCutscene({
                            duration: 1500,
                            skippable: true,
                            draw: (ctx, w, h, progress) => {
                                miniAnimRedrawRoom(ctx, w, h);
                                if (progress < 0.3) {
                                    // Reach toward field
                                    drawPlayerBody(ctx, px, py, sc, progress / 0.3 * 0.8);
                                } else if (progress < 0.5) {
                                    // ZAP! shock effect
                                    const zapP = (progress - 0.3) / 0.2;
                                    drawPlayerBody(ctx, px + Math.sin(zapP * 40) * 4, py, sc, 0.8);
                                    // Electric arcs
                                    ctx.strokeStyle = `rgba(100,200,255,${0.9 - zapP * 0.5})`;
                                    ctx.lineWidth = 2;
                                    for (let i = 0; i < 4; i++) {
                                        ctx.beginPath();
                                        const bx = px + 6 * sc;
                                        const by = py - 4 * sc + i * 3;
                                        ctx.moveTo(bx, by);
                                        for (let j = 1; j <= 3; j++) {
                                            ctx.lineTo(bx + j * 5, by + Math.sin(j * 17 + i * 7 + progress * 50) * 5);
                                        }
                                        ctx.stroke();
                                    }
                                    // Flash
                                    if (zapP < 0.3) {
                                        ctx.fillStyle = `rgba(150,220,255,${0.3 * (1 - zapP / 0.3)})`;
                                        ctx.fillRect(0, 0, w, h);
                                    }
                                    ctx.fillStyle = `rgba(255,255,100,${0.8 * (1 - zapP)})`;
                                    ctx.font = '18px "Courier New"';
                                    ctx.textAlign = 'center';
                                    ctx.fillText('ZAP!', px + 8 * sc, py - 20 * sc);
                                    ctx.textAlign = 'left';
                                } else {
                                    // Stagger back
                                    const stagger = (progress - 0.5) / 0.5;
                                    drawPlayerBody(ctx, px - stagger * 15, py, sc, (1 - stagger) * 0.3);
                                    // Smoke wisps from fingers
                                    if (stagger < 0.6) {
                                        ctx.fillStyle = `rgba(200,200,200,${0.3 * (1 - stagger / 0.6)})`;
                                        ctx.beginPath();
                                        ctx.arc(px + 6 * sc - stagger * 10, py - 4 * sc - stagger * 10, 3 + stagger * 4, 0, Math.PI * 2);
                                        ctx.fill();
                                    }
                                }
                            },
                            onEnd: () => {
                                engine.playerX = px;
                                engine.playerY = py;
                                e.showMessage('ZAP! Bad idea. The field shocks your fingers. You need to disable it using the console.');
                            }
                        });
                    }
                }
            },
            {
                name: 'Airlock', x: 0, y: 75, w: 32, h: 190, isExit: true, walkToX: 35,
                description: 'The airlock back to your shuttle.',
                look: (e) => e.showMessage('The airlock where you docked your shuttle. You could leave... but leaving without the Quantum Drive would mean this was all for nothing.'),
                get: (e) => e.showMessage('You can\'t "get" an airlock. That\'s not how airlocks work. That\'s not how any of this works.'),
                talk: (e) => e.showMessage('"Please don\'t decompress," you whisper to the airlock. Given that you\'re on an enemy ship, this is a real concern.'),
                onExit: (e) => {
                    if (!e.getFlag('field_down') || !e.getFlag('guard_defeated')) {
                        e.showMessage('You can\'t leave yet! The Quantum Drive is still here — you have to recover it. The galaxy is counting on you!');
                    } else {
                        e.showMessage('You should grab the Quantum Drive before leaving!');
                    }
                }
            },
            {
                name: 'Alien Pipes', x: 15, y: 8, w: 610, h: 12,
                description: 'Dark green pipes running along the ceiling.',
                look: (e) => e.showMessage('Thick, dark pipes run along the ceiling, carrying who-knows-what throughout the ship. One has a small leak venting greenish gas. The Draknoids clearly don\'t prioritize maintenance. Amateurs.'),
                get: (e) => e.showMessage('The pipes are way up on the ceiling and also alien and also probably full of something toxic. Three solid reasons to not touch them.'),
                use: (e) => e.showMessage('Your janitor instincts scream at you to fix that leak. But even you have limits. Enemy ship plumbing is where you draw the line.'),
                talk: (e) => e.showMessage('"You call that a pipe joint? Disgraceful. No sealant, no compression sleeve..." You catch yourself critiquing enemy infrastructure mid-heist. Focus, Wilkins.')
            },
            {
                name: 'Draknoid Insignia', x: 285, y: 305, w: 70, h: 65,
                description: 'A large emblem set into the floor.',
                look: (e) => { if (!engine.getFlag('looked_insignia')) { engine.setFlag('looked_insignia'); e.addScore(3); } e.showMessage('The Draknoid military insignia is set into the deck floor in dark metal - a fanged serpent coiling around a planet. Very menacing. Very dramatic. Someone really liked their graphic design budget.'); },
                get: (e) => e.showMessage('It\'s embedded in the deck plating. You\'d need a plasma torch and about three hours. You have neither.'),
                use: (e) => e.showMessage('You step on it defiantly. Take THAT, Draknoid Empire. They\'ll probably just buff out the footprint.')
            },
            {
                name: 'Brig Corridor',
                x: 608, y: 72, w: 32, h: 200, isExit: true, walkToX: 590, walkToY: 310,
                description: 'A dark corridor leads deeper into the ship — toward the detention block.',
                look: (e) => {
                    if (!e.getFlag('looked_brig_corridor')) {
                        e.setFlag('looked_brig_corridor');
                        e.addScore(3);
                    }
                    if (e.getFlag('rescued_prisoners')) {
                        e.showMessage('The corridor to the brig. The cells are empty now. You did good.');
                    } else {
                        e.showMessage('A dim corridor leads aft toward what you presume is the detention block. You can hear distant movement. Someone might be alive back there.');
                    }
                },
                onExit: (e) => {
                    if (e.getFlag('rescued_prisoners')) {
                        e.showMessage('The brig is already empty. Everyone is out.');
                    } else {
                        e.goToRoom('draknoid_brig', 300, 340);
                    }
                }
            }
        ]
    });

});
