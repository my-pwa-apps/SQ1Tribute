// ============================================================
// STAR SWEEPER - KERONA (desert, cave, outpost, cantina, shop)
// ============================================================

StarSweeper.defineRooms((engine) => {
    // ========== ROOM 5: DESERT ==========
    engine.registerRoom({
        id: 'desert',
        transition: 'wipe',
        hint: (e) => {
            if (!e.hasItem('medkit')) return 'The pod broke open on impact. Search the wreckage — the emergency kit may have spilled something useful.';
            if (!e.hasItem('crystal')) return 'There is a cave to the north. Something valuable lives in it.';
            return 'Head to the outpost. A xenon crystal is worth real buckazoids to the right buyer.';
        },
        name: 'Desert Planet',
        description: 'Your pod crashlands on a scorching desert planet — Kerona, if the charts are right; Unnamed Sandtrap if you\'re being honest. Twin suns blaze overhead. The air is dry as dust. You need to find shelter — preferably before you become a skeleton with a mop.',
        onEnter: (e) => {
            e.sound.startAmbient('desert_wind');
            if (!e.getFlag('desert_entered')) {
                e.setFlag('desert_entered');
                e.setFlag('desert_timer', 0);
            }
            // AGS-inspired: depth scaling — player shrinks toward horizon
            e.setDepthScaling(260, 370, 0.65, 1.0);

            // AGI-inspired barriers: crashed pod wreckage, rock formation
            e.addBarrier(80, 275, 130, 30);    // Crashed pod hull
            e.addBarrier(370, 265, 100, 15);   // Rock formation base

            // Edge transitions (AGI EGOEDGE): block east/west like original SQ1 desert
            e.setEdgeTransition('left', (eng) => {
                eng.showMessage('Nothing but endless sand dunes that way. You\'d die of exposure before finding anything.');
            });
            e.setEdgeTransition('right', (eng) => {
                eng.showMessage('The desert stretches to the horizon. Going that way would be suicide without more supplies.');
            });

            // Primary sun, high and to the right.
            e.setSceneLight(498, 78, 0.7);

            // Near dune ridge and a shaded boulder give the empty lower third a
            // foreground plane for the ego to walk behind.
            e.addForegroundLayer(374, (ctx) => {
                ctx.fillStyle = '#C97A2A';
                ctx.beginPath();
                ctx.moveTo(0, 400); ctx.lineTo(0, 372); ctx.lineTo(90, 361); ctx.lineTo(210, 372);
                ctx.lineTo(340, 364); ctx.lineTo(470, 375); ctx.lineTo(580, 366); ctx.lineTo(640, 373);
                ctx.lineTo(640, 400); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#FFAA00';
                ctx.beginPath();
                ctx.moveTo(0, 372); ctx.lineTo(90, 361); ctx.lineTo(210, 372); ctx.lineTo(340, 364);
                ctx.lineTo(470, 375); ctx.lineTo(580, 366); ctx.lineTo(640, 373);
                ctx.lineTo(640, 377); ctx.lineTo(0, 376); ctx.closePath(); ctx.fill();
                // Boulder, lit from the upper right to match the suns
                ctx.fillStyle = '#6a3c14';
                ctx.beginPath();
                ctx.moveTo(560, 400); ctx.lineTo(566, 358); ctx.lineTo(596, 344);
                ctx.lineTo(626, 356); ctx.lineTo(634, 400); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#8a5220';
                ctx.beginPath();
                ctx.moveTo(596, 344); ctx.lineTo(626, 356); ctx.lineTo(628, 400); ctx.lineTo(602, 400);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#C97A2A';
                ctx.fillRect(598, 350, 24, 3);
            });
        },
        onUpdate: (e, dt) => {
            if (!e.hasItem('survival_kit') && !e.getFlag('used_kit')) {
                let t = e.getFlag('desert_timer') || 0;
                t += dt;
                e.setFlag('desert_timer', t);
                if (t > 45000) {
                    e.die('The twin suns beat down mercilessly. Without water or shelter, the desert claims another victim. You collapse in the sand...');
                }
            }
        },
        draw: (ctx, w, h, eng) => {
            // High-contrast EGA desert, closer to early Sierra AGI screens.
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = '#0000AA';
            ctx.fillRect(0, 17, w, 112);
            ctx.fillStyle = '#5555FF';
            ctx.fillRect(0, 40, w, 70);
            ctx.fillStyle = '#55AAFF';
            ctx.fillRect(0, 110, w, 34);

            // Checker bands avoid soft gradients and keep a limited-palette look.
            // The lower band dithers into the horizon haze rather than straight
            // into sand yellow, which read as a green stripe across the sky.
            ditherRect(ctx, 0, 82, w, 44, '#5555FF', '#55AAFF', 2);
            ditherRect(ctx, 0, 129, w, 30, '#55AAFF', '#e0b070', 2);

            // Twin suns as round discs with soft halos (no hard outline).
            const disc = (cx, cy, r, color) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
            };
            // Larger white-hot sun.
            disc(498, 78, 26, '#FFFFAA');
            disc(498, 78, 22, '#FFFFFF');
            disc(498, 78, 17, '#FFFF55');
            disc(494, 73, 6, '#FFFFFF');
            // Smaller reddish sun.
            disc(564, 92, 16, '#FFFFAA');
            disc(564, 92, 13, '#FFFF55');
            disc(561, 89, 4, '#FFFFFF');

            // Horizon haze band behind the mesas (prevents black gaps between peaks).
            ctx.fillStyle = '#e0b070';
            ctx.fillRect(0, 150, w, 52);

            // Distant mesas and mountains. Aerial perspective: the furthest range
            // sits closest to the haze colour and the nearest range carries the
            // full-strength earth tone, so depth reads without any outline.
            ctx.fillStyle = '#D8A468';
            ctx.beginPath();
            ctx.moveTo(0, 179); ctx.lineTo(40, 160); ctx.lineTo(88, 166); ctx.lineTo(132, 148);
            ctx.lineTo(190, 170); ctx.lineTo(244, 156); ctx.lineTo(304, 176); ctx.lineTo(360, 150);
            ctx.lineTo(424, 166); ctx.lineTo(492, 146); ctx.lineTo(560, 168); ctx.lineTo(640, 154);
            ctx.lineTo(640, 196); ctx.lineTo(0, 196); ctx.closePath(); ctx.fill();
            ditherRect(ctx, 0, 150, w, 22, '#D8A468', '#e0b070', 2);
            ctx.fillStyle = '#B87038';
            ctx.beginPath();
            ctx.moveTo(0, 183); ctx.lineTo(42, 166); ctx.lineTo(92, 172); ctx.lineTo(134, 154);
            ctx.lineTo(192, 176); ctx.lineTo(246, 162); ctx.lineTo(306, 181); ctx.lineTo(362, 156);
            ctx.lineTo(424, 172); ctx.lineTo(494, 152); ctx.lineTo(560, 174); ctx.lineTo(640, 160);
            ctx.lineTo(640, 201); ctx.lineTo(0, 201); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#AA5500';
            ctx.beginPath();
            ctx.moveTo(0, 190); ctx.lineTo(58, 180); ctx.lineTo(120, 186); ctx.lineTo(178, 176);
            ctx.lineTo(250, 188); ctx.lineTo(322, 179); ctx.lineTo(400, 190); ctx.lineTo(470, 178);
            ctx.lineTo(548, 189); ctx.lineTo(640, 181);
            ctx.lineTo(640, 204); ctx.lineTo(0, 204); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFAA00';
            ctx.fillRect(0, 197, w, 6);

            // Sand field. Wavy dithered dune bodies rather than ruled stripes, which
            // previously read as colour banding instead of terrain.
            ctx.fillStyle = '#FFFF55';
            ctx.fillRect(0, 202, w, 198);
            const dune = (baseY, amp, period, c1, c2, thickness, crest) => {
                for (let x = 0; x < w; x += 2) {
                    const yy = Math.round(baseY + Math.sin(x / period) * amp);
                    ditherRect(ctx, x, yy, 2, thickness, c1, c2, 2);
                    // Windward crest catches the suns; the body below stays shaded.
                    ctx.fillStyle = crest;
                    ctx.fillRect(x, yy - 1, 2, 1);
                }
            };
            dune(210, 4, 200, '#AA5500', '#FFAA00', 6, '#FFCC44');
            dune(240, 9, 260, '#FFAA00', '#FFFF55', 14, '#FFEE88');
            dune(284, 13, 340, '#FFAA00', '#FFFF55', 20, '#FFEE88');
            dune(338, 15, 430, '#FFAA00', '#FFFF55', 26, '#FFEE88');

            // Two suns, two shadows. Both discs sit up and to the right, so every
            // solid object throws a long primary and a fainter secondary to the
            // lower-left. Without these the desert had no light direction at all.
            const castShade = (cx, cy, rx, ry) => {
                ctx.fillStyle = 'rgba(150,80,0,0.26)';
                ctx.beginPath(); ctx.ellipse(cx - rx * 0.55, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(150,80,0,0.14)';
                ctx.beginPath(); ctx.ellipse(cx - rx * 0.95, cy + ry * 0.4, rx * 1.15, ry * 0.8, 0, 0, Math.PI * 2); ctx.fill();
            };
            castShade(146, 303, 74, 10);
            castShade(420, 224, 58, 7);
            castShade(303, 324, 22, 5);
            castShade(521, 332, 12, 4);
            castShade(260, 342, 20, 4);

            // Crashed escape pod: the same capsule as the bay, nose-up in the sand.
            drawEscapePod(ctx, 146, 272, 3.9, -0.30, true);
            // Sand drifted over the buried lower hull.
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.moveTo(64, 334); ctx.lineTo(92, 298); ctx.lineTo(138, 304);
            ctx.lineTo(180, 296); ctx.lineTo(216, 308); ctx.lineTo(244, 334);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFEE88';
            ctx.beginPath();
            ctx.moveTo(92, 298); ctx.lineTo(138, 304); ctx.lineTo(180, 296); ctx.lineTo(216, 308);
            ctx.lineTo(214, 313); ctx.lineTo(180, 301); ctx.lineTo(138, 309); ctx.lineTo(94, 303);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#AA5500';
            ctx.fillRect(110, 316, 118, 3);
            // Torn hull plates thrown clear of the impact
            ctx.fillStyle = '#555555';
            ctx.fillRect(208, 294, 10, 5);
            ctx.fillRect(230, 300, 6, 4);
            ctx.fillRect(252, 296, 5, 4);
            // Emergency beacon, still blinking
            ctx.fillStyle = Math.floor(eng.animTimer / 500) % 2 ? '#FF3322' : '#661410';
            ctx.fillRect(194, 244, 5, 5);

            const smokeFrame = Math.floor(eng.animTimer / 320) % 3;
            ctx.fillStyle = '#555555';
            ctx.fillRect(148 + smokeFrame * 3, 244 - smokeFrame * 5, 10, 5);
            ctx.fillRect(156 - smokeFrame * 2, 232 - smokeFrame * 4, 14, 6);
            ctx.fillStyle = '#AAAAAA';
            ctx.fillRect(151 + smokeFrame * 3, 246 - smokeFrame * 5, 5, 2);
            ctx.fillRect(160 - smokeFrame * 2, 234 - smokeFrame * 4, 6, 2);

            // North rock formation and cave entrance. Stepped mesa profile rather
            // than a single peak, so it reads as eroded rock instead of a cone.
            ctx.fillStyle = '#7a4a1e';
            ctx.beginPath();
            ctx.moveTo(364, 224); ctx.lineTo(376, 186); ctx.lineTo(400, 180); ctx.lineTo(406, 166);
            ctx.lineTo(444, 160); ctx.lineTo(452, 178); ctx.lineTo(466, 190); ctx.lineTo(477, 225);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#AA5500';
            ctx.beginPath();
            ctx.moveTo(374, 220); ctx.lineTo(384, 190); ctx.lineTo(404, 185); ctx.lineTo(410, 172);
            ctx.lineTo(440, 167); ctx.lineTo(447, 184); ctx.lineTo(459, 196); ctx.lineTo(468, 220);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#FFAA00';
            ctx.beginPath();
            ctx.moveTo(384, 190); ctx.lineTo(404, 185); ctx.lineTo(398, 216); ctx.lineTo(382, 221);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#555500';
            ctx.beginPath();
            ctx.moveTo(440, 167); ctx.lineTo(447, 184); ctx.lineTo(459, 196); ctx.lineTo(468, 220); ctx.lineTo(438, 220);
            ctx.closePath(); ctx.fill();
            // Eroded strata catch the low suns and break up the silhouette.
            ctx.fillStyle = '#C97A2A';
            ctx.fillRect(388, 198, 22, 2);
            ctx.fillRect(432, 190, 24, 2);
            ctx.fillStyle = '#6a3c14';
            ctx.fillRect(392, 208, 18, 2);
            ctx.fillStyle = '#000000';
            ctx.fillRect(403, 196, 29, 27);
            ctx.fillStyle = '#550000';
            ctx.fillRect(410, 201, 14, 20);

            // Foreground cactus and sparse desert detail.
            ctx.fillStyle = '#006622';
            ctx.fillRect(296, 274, 12, 51);
            ctx.fillRect(285, 292, 14, 7);
            ctx.fillRect(285, 282, 7, 17);
            ctx.fillRect(306, 288, 15, 7);
            ctx.fillRect(314, 276, 7, 19);
            ctx.fillStyle = '#00AA00';
            ctx.fillRect(300, 274, 4, 47);
            ctx.fillRect(288, 291, 12, 4);
            ctx.fillRect(288, 282, 4, 13);
            ctx.fillRect(304, 287, 14, 4);
            ctx.fillRect(314, 276, 4, 15);

            ctx.fillStyle = '#006622';
            ctx.fillRect(518, 308, 9, 25);
            ctx.fillRect(510, 319, 10, 5);
            ctx.fillStyle = '#00AA00';
            ctx.fillRect(521, 308, 3, 22);
            ctx.fillRect(512, 318, 9, 3);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(246, 338, 27, 4);
            ctx.fillRect(260, 332, 4, 11);
            ctx.fillRect(270, 335, 11, 3);
            ctx.fillRect(242, 334, 10, 8);
            ctx.fillStyle = '#000000';
            ctx.fillRect(244, 336, 3, 3);
            ctx.fillRect(254, 342, 23, 2);

            ctx.fillStyle = '#AA5500';
            [[214, 310], [240, 305], [270, 310], [300, 303], [330, 308], [360, 300]].forEach((p, i) => {
                ctx.fillRect(p[0], p[1], 7, 3);
                ctx.fillRect(p[0] + (i % 2 ? -3 : 3), p[1] + 7, 7, 3);
            });

            for (let i = 0; i < 48; i++) {
                const x = ((i * 83 + 19) % 620) + 8;
                const y = 232 + ((i * 47) % 150);
                ctx.fillStyle = i % 3 === 0 ? '#AA5500' : '#FFAA00';
                ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, 1);
            }

            const wind = Math.floor(eng.animTimer / 110) % 80;
            ctx.fillStyle = '#FFFFFF';
            for (let p = 0; p < 5; p++) {
                const px = (wind * 8 + p * 137) % 700 - 40;
                const py = 258 + p * 25 + ((p * 11) % 9);
                ctx.fillRect(px, py, 18, 1);
                ctx.fillRect(px + 25, py + 4, 10, 1);
            }

            // Secondary shadow from the smaller sun. The engine draws the primary
            // from eng.sceneLight; this one has to be painted under the ego here.
            if (eng.playerVisible && !eng.dead) {
                const ps = eng.playerSpriteScale(eng.playerY);
                eng.drawContactShadow(ctx, eng.playerX, eng.playerY + 12 * ps, ps, {
                    alpha: 0.15, light: { x: 564, y: 92, strength: 0.8 }
                });
            }
        },
        hotspots: [
            {
                name: 'Desert Sand', x: 0, y: 190, w: 640, h: 210,
                description: 'Nothing but endless sand and scorching heat.',
                look: (e) => e.showMessage('Sand in every direction. The twin suns beat down relentlessly. Your uniform is soaked with sweat. You need to find shelter or you won\'t last long.'),
                useItem: (e, itemId) => {
                    if (itemId === 'survival_kit') {
                        e.showMessage('You use the water purification tablets and take a long drink. The nutrient bar tastes terrible but gives you energy. You can survive the desert now.');
                        e.setFlag('used_kit');
                    } else {
                        e.showMessage('That won\'t help you out here in the desert.');
                    }
                }
            },
            {
                name: 'Crashed Pod', x: 86, y: 232, w: 130, h: 80,
                description: 'The wreckage of your escape pod.',
                // Deliberate consolation award: the wreck medkit (+3) only exists for players
                // who never healed Korvak (+20), so the two are mutually exclusive by design
                // and a single run can never collect both. maxScore reflects the better route.
                look: (e) => {
                    if (!engine.getFlag('looked_crashed_pod')) { engine.setFlag('looked_crashed_pod'); e.addScore(3); }
                    if (!e.hasItem('medkit') && !e.getFlag('got_medkit_wreck') && !e.getFlag('korvak_freed')) {
                        e.showMessage('Your escape pod is totaled \u2014 half-buried in the sand and smoking. The fire suppression locker burst open on impact; a battered medkit is wedged in the debris.');
                    } else {
                        e.showMessage('Your escape pod is totaled \u2014 half-buried in the sand and smoking. It\'s not going anywhere. You\'re stranded on this desert world.');
                    }
                },
                get: (e) => {
                    if (!e.hasItem('medkit') && !e.getFlag('got_medkit_wreck') && !e.getFlag('korvak_freed')) {
                        e.addToInventory('medkit');
                        e.setFlag('got_medkit_wreck');
                        e.addScore(3);
                        e.showMessage('You pry the medkit free of the wreckage. The seal is cracked but the contents look intact. Past-you, who forgot to grab one in the pod bay, owes present-you a drink.');
                    } else {
                        e.showMessage('The pod is completely wrecked. Nothing else salvageable remains.');
                    }
                },
                use: (e) => e.showMessage('The pod is beyond repair. Time to find another way off this rock.')
            },
            {
                name: 'Rock Formation', x: 365, y: 150, w: 110, h: 75, isExit: true, walkToX: 420, walkToY: 282,
                description: 'A rocky outcropping in the distance. Is that an opening?',
                look: (e) => e.showMessage('A cluster of large rocks to the north. There seems to be a dark opening between them — a cave, perhaps? Shelter from the suns would be very welcome.'),
                onExit: (e) => {
                    if (e.hasItem('survival_kit') || e.getFlag('used_kit')) {
                        e.showMessage('You trek across the scorching sand toward the rocks. The survival kit\'s water tablets keep you hydrated enough to make it...');
                        e.setFlag('used_kit');
                        e.goToRoom('cave', 320, 310);
                    } else {
                        e.showMessage('You start toward the rocks. The suns start toward cooking you. You retreat.');
                    }
                }
            },
            {
                name: 'Desert (East)', x: 580, y: 190, w: 60, h: 210,
                description: 'Endless desert stretches east.',
                look: (e) => e.showMessage('Nothing but endless sand dunes stretching east to the horizon. Going that way would be suicide without proper navigation.'),
                walk: (e) => e.showMessage('You take a few steps east but quickly realize there\'s nothing out there. Just sand, sand, and more sand. Death lies that way.')
            },
            {
                name: 'Desert (West)', x: 0, y: 190, w: 40, h: 210,
                description: 'Endless desert stretches west.',
                look: (e) => e.showMessage('The western horizon is a wall of shimmering heat. There\'s no shade, no water, no life. Only a fool would head that way.'),
                walk: (e) => e.showMessage('Something tells you there\'s nothing but death in that direction. The rocks to the north look more promising.')
            },
            {
                name: 'Alien Plant', x: 292, y: 268, w: 22, h: 35,
                description: 'A small alien plant clinging to life.',
                look: (e) => e.showMessage('A hardy little alien plant — some kind of desert succulent. Its round, bluish leaves store water. Life finds a way, even here.'),
                get: (e) => e.showMessage('You try to uproot the plant. It doesn\'t budge — its roots go deep. Besides, stealing the only visible life form on a dead planet seems rude.'),
                use: (e) => e.showMessage('You\'re not sure what to do with an alien cactus. Water it? With what? Your tears of existential dread?'),
                talk: (e) => e.showMessage('"Hang in there, buddy," you tell the plant. It doesn\'t respond, but you feel slightly less alone.')
            },
            {
                name: 'Alien Bones', x: 240, y: 330, w: 40, h: 20,
                description: 'Bleached bones half-buried in sand.',
                look: (e) => { if (!engine.getFlag('looked_bones')) { engine.setFlag('looked_bones'); e.addScore(2); } e.showMessage('The bleached skeleton of some alien creature, half-buried in sand. It has too many ribs and what appears to be a second skull. This planet is NOT friendly.'); },
                get: (e) => e.showMessage('You pick up a bone. It crumbles to dust in your hand. Whatever died here did so a VERY long time ago. Comforting.'),
                talk: (e) => e.showMessage('"So... how long did YOU last out here?" The skeleton does not answer. Its empty eye sockets stare accusingly.')
            },
            {
                name: 'Twin Suns', x: 430, y: 15, w: 140, h: 90,
                description: 'Two blazing suns in the orange sky.',
                look: (e) => e.showMessage('Twin suns blaze down from a burnt-orange sky. The larger one is white-hot; the smaller has a reddish tinge. Together they\'re cooking this planet like an oven. Your SPF 9000 sunscreen would be useless here.'),
                get: (e) => e.showMessage('You reach toward the suns. Your arm isn\'t long enough. Shocking, really.'),
                use: (e) => e.showMessage('You can\'t use the suns. They\'re using YOU — as a slow-roast experiment.')
            }
        ]
    });

    // ========== ROOM 6: CAVE ==========
    engine.registerRoom({
        id: 'cave',
        transition: 'iris',
        hint: 'A glowing xenon crystal is somewhere in here. Take it without inviting whatever lives in here to dinner.',
        name: 'Underground Cave',
        description: 'A cool underground cave — blessed relief from the desert heat. Crystalline formations glitter on the walls. A tunnel leads deeper underground.',
        onEnter: (e) => {
            e.sound.startAmbient('cave_drip');
            // AGS-inspired: depth scaling — cave has mild perspective
            e.setDepthScaling(270, 365, 0.75, 1.0);

            // AGI-inspired barriers: stalagmites, underground pool
            e.addBarrier(115, 290, 15, 35);    // Left stalagmite
            e.addBarrier(345, 285, 15, 40);    // Center stalagmite
            e.addBarrier(545, 290, 15, 35);    // Right stalagmite
            e.addBarrier(60, 330, 140, 25);    // Underground pool

            // Foreground layer: stalagmite tips draw over player
            e.addForegroundLayer(320, (ctx) => {
                // Center stalagmite foreground tip
                ctx.fillStyle = '#3d2e1e';
                ctx.beginPath();
                ctx.moveTo(352, 270); ctx.lineTo(347, 325); ctx.lineTo(357, 325);
                ctx.closePath(); ctx.fill();
            });

            // The crystals are the only real light source in here, so give the
            // ego a gentle rim-light kiss when standing near them. The first cut
            // of this washed the entire cave into a flat cyan haze; it now only
            // grazes a tight radius so the crystal peaks read as crystal, and the
            // player, and not as one merged glowing blob.
            e.addForegroundLayer(9999, (ctx, eng) => {
                if (eng.getFlag('got_crystal')) return;
                const dist = Math.hypot(eng.playerX - 320, eng.playerY - 280);
                if (dist > 130) return;
                const near = 1 - Math.min(dist / 130, 1);
                const pulse = (0.05 + Math.sin(eng.animTimer / 600) * 0.018) * near;
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const g = ctx.createRadialGradient(eng.playerX, eng.playerY - 20, 4, eng.playerX, eng.playerY - 20, 46);
                g.addColorStop(0, `rgba(60,220,200,${pulse})`);
                g.addColorStop(1, 'rgba(50,180,170,0)');
                ctx.fillStyle = g;
                ctx.fillRect(eng.playerX - 46, eng.playerY - 66, 92, 92);
                ctx.restore();
            });

            // Crystals light the room from floor level, so shadows fan outward.
            e.setSceneLight(320, 262, 0.5);

            // Edge transitions
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('desert', 430, 305);
            });
            e.setEdgeTransition('right', (eng) => {
                if (!eng.getFlag('reached_outpost')) {
                    eng.setFlag('reached_outpost');
                    eng.addScore(10);
                }
                eng.goToRoom('outpost', 100, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Quiet rock planes leave high-frequency texture for mineral seams.
            ctx.fillStyle = '#17100c';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#4a2b18';
            ctx.beginPath();
            ctx.moveTo(46, 98); ctx.lineTo(98, 74); ctx.lineTo(170, 86); ctx.lineTo(240, 70);
            ctx.lineTo(324, 82); ctx.lineTo(408, 68); ctx.lineTo(486, 84); ctx.lineTo(558, 72);
            ctx.lineTo(590, 106); ctx.lineTo(578, 190); ctx.lineTo(592, 266);
            ctx.lineTo(514, 286); ctx.lineTo(412, 272); ctx.lineTo(316, 288);
            ctx.lineTo(210, 274); ctx.lineTo(120, 288); ctx.lineTo(54, 270); ctx.lineTo(42, 186);
            ctx.closePath(); ctx.fill();
            ditherRect(ctx, 98, 106, 444, 24, '#3b2113', '#6a3d20', 5);
            // Tonal blotches break up the rock face without hard edges.
            ctx.fillStyle = 'rgba(28,16,10,0.35)';
            ctx.beginPath(); ctx.ellipse(196, 214, 74, 34, 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(452, 190, 62, 28, -0.15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(122,74,38,0.22)';
            ctx.beginPath(); ctx.ellipse(330, 176, 88, 30, 0.05, 0, Math.PI * 2); ctx.fill();

            // Mineral strata follow the cave's perspective instead of reading
            // as decoration pasted onto a flat wall.
            ctx.strokeStyle = 'rgba(154,92,48,0.34)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(70, 126); ctx.lineTo(188, 150); ctx.lineTo(276, 158);
            ctx.moveTo(570, 116); ctx.lineTo(470, 146); ctx.lineTo(370, 158);
            ctx.moveTo(82, 258); ctx.lineTo(198, 244); ctx.lineTo(278, 232);
            ctx.moveTo(558, 250); ctx.lineTo(456, 238); ctx.lineTo(366, 230);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = 'rgba(214,145,74,0.42)';
            [[116, 164], [137, 171], [222, 118], [484, 116], [515, 174], [438, 258]].forEach(([x, y]) => {
                ctx.fillRect(x, y, 3, 2);
                ctx.fillRect(x + 5, y + 2, 2, 2);
            });
            ctx.fillStyle = '#100b08';
            ctx.beginPath();
            ctx.moveTo(0, 55); ctx.lineTo(90, 95); ctx.lineTo(125, 285); ctx.lineTo(0, 330);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(w, 50); ctx.lineTo(555, 92); ctx.lineTo(520, 285); ctx.lineTo(w, 325);
            ctx.closePath(); ctx.fill();

            // Rock ceiling
            ctx.fillStyle = '#2a1e14';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(0, 80);
            ctx.quadraticCurveTo(100, 30, 200, 60);
            ctx.quadraticCurveTo(320, 15, 440, 50);
            ctx.quadraticCurveTo(560, 20, 640, 70);
            ctx.lineTo(640, 0);
            ctx.closePath(); ctx.fill();

            // Stalactites
            ctx.fillStyle = '#3a2e22';
            const stalX = [80, 180, 290, 400, 520, 600];
            const stalH = [40, 55, 35, 60, 45, 30];
            stalX.forEach((sx, i) => {
                ctx.beginPath();
                ctx.moveTo(sx - 8, 30 + (i % 3) * 10);
                ctx.lineTo(sx, 30 + stalH[i] + (i % 3) * 10);
                ctx.lineTo(sx + 8, 30 + (i % 3) * 10);
                ctx.closePath(); ctx.fill();
            });

            // Floor - rocky
            ctx.fillStyle = '#2a1e14';
            ctx.beginPath();
            ctx.moveTo(0, 320);
            ctx.quadraticCurveTo(100, 310, 200, 325);
            ctx.quadraticCurveTo(320, 335, 440, 320);
            ctx.quadraticCurveTo(560, 330, 640, 315);
            ctx.lineTo(640, 400); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();

            // Broad rock bands converge on the crystal chamber, giving the
            // irregular floor the same clear depth cues as a Sierra interior.
            ctx.strokeStyle = 'rgba(102,75,50,0.34)';
            ctx.beginPath();
            ctx.moveTo(320, 286); ctx.lineTo(230, 400);
            ctx.moveTo(320, 286); ctx.lineTo(80, 400);
            ctx.moveTo(320, 286); ctx.lineTo(410, 400);
            ctx.moveTo(320, 286); ctx.lineTo(560, 400);
            ctx.stroke();
            ctx.fillStyle = 'rgba(117,82,50,0.3)';
            ctx.fillRect(235, 352, 18, 3);
            ctx.fillRect(416, 338, 23, 3);
            ctx.fillRect(272, 382, 9, 2);
            ctx.fillRect(494, 371, 14, 2);

            // Stalagmites
            ctx.fillStyle = '#3a2e22';
            [120, 350, 550].forEach((sx, i) => {
                ctx.beginPath();
                ctx.moveTo(sx - 12, 320 + (i % 2) * 5);
                ctx.lineTo(sx, 280 - i * 10);
                ctx.lineTo(sx + 12, 320 + (i % 2) * 5);
                ctx.closePath(); ctx.fill();
            });

            // Crystal formation (center) - the valuable one
            if (!eng.getFlag('got_crystal')) {
                const crystTime = eng.animTimer / 600;
                const glow = 0.5 + Math.sin(crystTime) * 0.3;

                // Crystal glow
                ctx.fillStyle = `rgba(50,200,180,${glow * 0.15})`;
                ctx.beginPath();
                ctx.arc(320, 250, 50, 0, Math.PI * 2); ctx.fill();

                // Crystals
                const drawCrystal = (cx, cy, cw, ch, color) => {
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy); ctx.lineTo(cx + cw / 2, cy - ch);
                    ctx.lineTo(cx + cw, cy);
                    ctx.closePath(); ctx.fill();
                };
                drawCrystal(290, 280, 14, 45, `rgba(40,180,160,${glow})`);
                drawCrystal(308, 285, 12, 55, `rgba(60,220,200,${glow})`);
                drawCrystal(322, 280, 16, 50, `rgba(50,200,180,${glow})`);
                drawCrystal(340, 285, 10, 35, `rgba(40,190,170,${glow})`);
                drawCrystal(300, 290, 8, 25, `rgba(70,230,210,${glow})`);

                // Ambient crystal spark particles
                const sparkPhase = Math.floor(eng.animTimer / 150) % 3;
                ctx.fillStyle = '#FFFFFF';
                if (sparkPhase === 0) ctx.fillRect(312, 235, 2, 2);
                else if (sparkPhase === 1) ctx.fillRect(296, 245, 2, 2);
                else ctx.fillRect(324, 250, 2, 2);

                // Sparkle
                ctx.fillStyle = `rgba(200,255,250,${Math.sin(crystTime * 2) * 0.5 + 0.5})`;
                ctx.fillRect(315, 230, 3, 3);
                ctx.fillRect(330, 245, 2, 2);
                ctx.fillRect(298, 260, 2, 2);
            }

            // Wall crystals (smaller, decoration)
            ctx.fillStyle = 'rgba(100,80,60,0.6)';
            ctx.fillRect(50, 150, 8, 20);
            ctx.fillRect(55, 140, 6, 15);
            ctx.fillStyle = 'rgba(80,60,40,0.4)';
            ctx.fillRect(570, 130, 10, 25);
            ctx.fillRect(580, 125, 6, 18);

            // Glowing mushrooms along cave floor
            const mushGlow = 0.5 + Math.sin(eng.animTimer / 900) * 0.3;
            ctx.fillStyle = `rgba(180,100,220,${mushGlow * 0.7})`;
            // Mushroom 1
            ctx.fillRect(170, 315, 3, 8);
            ctx.beginPath(); ctx.arc(171, 313, 5, Math.PI, 0); ctx.fill();
            // Mushroom 2
            ctx.fillRect(190, 318, 2, 6);
            ctx.beginPath(); ctx.arc(191, 316, 4, Math.PI, 0); ctx.fill();
            // Ground glow from mushrooms
            ctx.fillStyle = `rgba(180,100,220,${mushGlow * 0.06})`;
            ctx.beginPath(); ctx.ellipse(180, 322, 20, 5, 0, 0, Math.PI * 2); ctx.fill();

            // Mushroom cluster near pool
            ctx.fillStyle = `rgba(120,200,150,${mushGlow * 0.6})`;
            ctx.fillRect(80, 328, 2, 6);
            ctx.beginPath(); ctx.arc(81, 326, 4, Math.PI, 0); ctx.fill();
            ctx.fillRect(90, 326, 2, 8);
            ctx.beginPath(); ctx.arc(91, 324, 3, Math.PI, 0); ctx.fill();

            // Dripping water (stalactite drip)
            const dripY = (eng.animTimer / 15) % 80;
            ctx.fillStyle = 'rgba(100,180,200,0.5)';
            ctx.fillRect(290, 70 + dripY, 2, 3);

            // Bat sleeping on ceiling (tiny detail)
            ctx.fillStyle = '#1a1208';
            ctx.fillRect(450, 42, 4, 5);
            ctx.fillRect(446, 42, 3, 3);
            ctx.fillRect(455, 42, 3, 3);

            // Underground pool (left)
            ctx.fillStyle = '#0a1520';
            ctx.beginPath();
            ctx.ellipse(130, 340, 70, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pool reflection
            ctx.fillStyle = `rgba(50,150,180,${0.2 + Math.sin(eng.animTimer / 1000) * 0.08})`;
            ctx.beginPath();
            ctx.ellipse(130, 340, 65, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tunnel opening (right - leads to outpost)
            ctx.fillStyle = '#0a0805';
            ctx.beginPath();
            ctx.ellipse(580, 280, 40, 55, 0, 0, Math.PI * 2);
            ctx.fill();
            // Faint light from tunnel
            ctx.fillStyle = 'rgba(180,150,100,0.08)';
            ctx.beginPath();
            ctx.ellipse(580, 280, 35, 48, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(214,170,92,0.24)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(580, 280, 42, 58, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = 1;

            // Cave entrance (back to desert - top left): an irregular daylight
            // opening, so the brightest shape in the cave still reads as rock.
            ctx.fillStyle = '#7a4a22';
            ctx.beginPath();
            ctx.moveTo(0, 66); ctx.lineTo(26, 76); ctx.lineTo(48, 102); ctx.lineTo(60, 140);
            ctx.lineTo(50, 176); ctx.lineTo(30, 196); ctx.lineTo(0, 206);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#CC9944';
            ctx.beginPath();
            ctx.moveTo(0, 78); ctx.lineTo(22, 88); ctx.lineTo(41, 110); ctx.lineTo(51, 142);
            ctx.lineTo(42, 172); ctx.lineTo(24, 188); ctx.lineTo(0, 196);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#DDAA55';
            ctx.beginPath();
            ctx.moveTo(0, 92); ctx.lineTo(16, 100); ctx.lineTo(32, 120); ctx.lineTo(38, 144);
            ctx.lineTo(29, 166); ctx.lineTo(13, 178); ctx.lineTo(0, 184);
            ctx.closePath(); ctx.fill();
            // Rock lip overlapping the opening so it sits inside the wall.
            ctx.fillStyle = '#241710';
            ctx.beginPath();
            ctx.moveTo(30, 62); ctx.lineTo(58, 84); ctx.lineTo(70, 132); ctx.lineTo(62, 184);
            ctx.lineTo(40, 210); ctx.lineTo(58, 214); ctx.lineTo(80, 176); ctx.lineTo(86, 118);
            ctx.lineTo(64, 66);
            ctx.closePath(); ctx.fill();

            // Alien pictographs on clear rock, drawn after the entrance so the
            // daylight opening can never bury them.
            ctx.fillStyle = 'rgba(196,136,88,0.55)';
            ctx.fillRect(155, 228, 2, 10);
            ctx.fillRect(150, 232, 12, 2);
            ctx.fillRect(153, 238, 3, 6);
            ctx.fillRect(158, 238, 3, 6);
            ctx.beginPath(); ctx.arc(156, 226, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(175, 234, 14, 6);
            ctx.fillRect(175, 240, 2, 5);
            ctx.fillRect(187, 240, 2, 5);
            ctx.fillRect(180, 231, 3, 3);
            ctx.fillRect(160, 216, 3, 3);
            ctx.fillRect(180, 213, 2, 2);
            ctx.fillRect(170, 220, 2, 2);
            // Light beam from entrance
            ctx.fillStyle = 'rgba(220,180,100,0.06)';
            ctx.beginPath();
            ctx.moveTo(0, 85); ctx.lineTo(120, 190); ctx.lineTo(120, 280);
            ctx.lineTo(0, 195);
            ctx.closePath(); ctx.fill();
        },
        hotspots: [
            {
                name: 'Crystal Formation', x: 280, y: 220, w: 80, h: 75,
                description: 'A cluster of beautiful glowing crystals.',
                look: (e) => {
                    if (e.getFlag('got_crystal')) {
                        e.showMessage('The remaining crystal fragments are too small to be useful.');
                    } else {
                        e.showMessage('A magnificent formation of xenon crystals! They pulse with an inner blue-green luminescence. These are incredibly rare and valuable — prized by collectors and scientists across the galaxy.');
                    }
                },
                get: (e) => {
                    if (!e.getFlag('got_crystal')) {
                        engine.sound.crystalHum();
                        e.showMessage('You carefully break off one of the larger crystals. It thrums with energy in your hand. This must be worth a fortune!');
                        e.addToInventory('crystal');
                        e.setFlag('got_crystal');
                        e.addScore(15);
                    } else {
                        e.showMessage('The remaining fragments are too small and fragile to take.');
                    }
                }
            },
            {
                name: 'Underground Pool', x: 55, y: 325, w: 150, h: 35,
                description: 'A still underground pool.',
                look: (e) => e.showMessage('A pool of perfectly still water. In its dark surface you see the faint reflections of crystals. The water looks clean enough to drink.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = engine.playerSpriteScale(py);
                    e.playCutscene({
                        duration: 2000,
                        skippable: true,
                        draw: (ctx, w, h, progress) => {
                            miniAnimRedrawRoom(ctx, w, h);
                            // Player kneels down
                            const kneelY = py + (progress < 0.25 ? (progress / 0.25) * 8 * sc : (progress > 0.75 ? (1 - (progress - 0.75) / 0.25) * 8 * sc : 8 * sc));
                            drawPlayerBody(ctx, px, kneelY, sc * 0.85, progress > 0.2 && progress < 0.8 ? 0.6 : 0);
                            // Water splash effect
                            if (progress > 0.3 && progress < 0.7) {
                                const wp = (progress - 0.3) / 0.4;
                                // Droplets flying up
                                for (let i = 0; i < 8; i++) {
                                    const angle = (i / 8) * Math.PI;
                                    const dist = wp * 20;
                                    const dx = px + Math.cos(angle) * dist;
                                    const dy = kneelY - 2 * sc - Math.sin(angle) * dist * 1.5 + wp * wp * 15;
                                    const alpha = 0.7 * (1 - wp);
                                    ctx.fillStyle = `rgba(100,180,220,${alpha})`;
                                    ctx.beginPath();
                                    ctx.arc(dx, dy, 2 - wp, 0, Math.PI * 2);
                                    ctx.fill();
                                }
                                // Water dripping from face
                                if (wp > 0.3) {
                                    ctx.fillStyle = `rgba(120,190,230,${0.5 * (1 - wp)})`;
                                    ctx.fillRect(px - 2 * sc, kneelY - 14 * sc * 0.85, 1, (wp - 0.3) * 15);
                                    ctx.fillRect(px + 2 * sc, kneelY - 13 * sc * 0.85, 1, (wp - 0.3) * 12);
                                }
                            }
                        },
                        onEnd: () => {
                            engine.playerX = px;
                            engine.playerY = py;
                            e.showMessage('You splash some cool water on your face. Refreshing!');
                        }
                    });
                },
                get: (e) => e.showMessage('You cup your hands and drink some water. It has a slight mineral taste but seems safe enough.')
            },
            {
                name: 'Tunnel', x: 535, y: 220, w: 90, h: 120, isExit: true, walkToX: 560, walkToY: 330,
                description: 'A dark tunnel leading deeper underground.',
                look: (e) => e.showMessage('A tunnel stretches into darkness, but you can see faint warm light at the far end. It seems to lead somewhere inhabited. Could there be a settlement on this planet?'),
                onExit: (e) => {
                    e.showMessage('You enter the tunnel. After a long walk through winding passages, you emerge into daylight...');
                    if (!e.getFlag('reached_outpost')) {
                        e.setFlag('reached_outpost');
                        e.addScore(10);
                    }
                    e.goToRoom('outpost', 100, 310);
                }
            },
            {
                name: 'Cave Entrance', x: 0, y: 75, w: 55, h: 130, isExit: true, walkToX: 40,
                description: 'The cave entrance, leading back to the desert.',
                look: (e) => e.showMessage('Bright orange light pours in from outside. The twin suns make the cave entrance glow like a furnace mouth. You don\'t miss the heat.'),
                onExit: (e) => e.goToRoom('desert', 430, 305)
            },
            {
                name: 'Glowing Mushrooms', x: 65, y: 315, w: 50, h: 25,
                description: 'Clusters of softly glowing mushrooms.',
                look: (e) => { if (!engine.getFlag('looked_mushrooms')) { engine.setFlag('looked_mushrooms'); e.addScore(2); } e.showMessage('Bioluminescent mushrooms cluster near the pool, casting a soft blue-green glow. They pulse gently, almost like breathing. Pretty, but you wouldn\'t eat them — your xenobiology training (which consists of zero hours) says "don\'t eat glowing things."'); },
                get: (e) => e.showMessage('You pluck a mushroom. It immediately stops glowing and goes limp in your hand. Now you feel guilty. You put it back.'),
                use: (e) => {
                    if (!e.getFlag('warn_mushroom')) {
                        e.setFlag('warn_mushroom');
                        e.showMessage('You consider eating one. Every fiber of your being, plus several mandatory safety posters, scream NO. You put it down. For now.');
                    } else {
                        e.die('You eat a glowing mushroom on the second try, because apparently you learn nothing. It tastes like copper pennies marinated in bad decisions. The fungus glows, briefly, from INSIDE you. Then everything glows. Then nothing does.');
                    }
                },
                talk: (e) => e.showMessage('"Glow, little buddies, glow." They pulse a bit brighter. Coincidence? Probably. But you smile anyway.')
            },
            {
                name: 'Cave Paintings', x: 145, y: 208, w: 56, h: 44,
                description: 'Primitive paintings on the cave wall.',
                look: (e) => { if (!engine.getFlag('looked_paintings')) { engine.setFlag('looked_paintings'); e.addScore(3); } e.showMessage('Crude but striking pictographs painted on the cave wall in rusty pigment. They depict stick figures hunting a large creature under twin suns. There\'s also what might be a spaceship. Someone — or someTHING — was here before you.'); },
                get: (e) => e.showMessage('These paintings are thousands of years old. You\'re a janitor who respects the sanctity of historical surfaces. Well, except for that graffiti on Deck 3.'),
                use: (e) => e.showMessage('You trace a finger along the ancient lines. The paint is long-dried. You wonder what happened to the artists. Given the skeleton outside, maybe don\'t wonder too hard.'),
                talk: (e) => e.showMessage('"What were you trying to tell us?" you muse at the paintings. The stick figures stare back with their blank dot heads, keeping their secrets.')
            },
            {
                name: 'Stalactites', x: 200, y: 15, w: 250, h: 60,
                description: 'Stalactites hanging from the cave ceiling.',
                look: (e) => e.showMessage('Massive stalactites hang from the ceiling, some dripping water into the pool below. They\'ve been growing for millennia, one drop at a time. You respect their work ethic.'),
                get: (e) => e.showMessage('They\'re on the ceiling. Unless you\'ve suddenly grown ten feet taller, these are staying where they are.'),
                talk: (e) => e.showMessage('"Don\'t fall on me," you request politely. The stalactites make no promises.')
            },
            {
                name: 'Bat', x: 440, y: 36, w: 20, h: 14,
                description: 'Something small hanging from the ceiling.',
                look: (e) => e.showMessage('A small bat-like creature hangs upside down from a stalactite, fast asleep. It has four wings folded tightly and a tiny fox-like face. Kind of cute, actually.'),
                get: (e) => e.showMessage('You reach up but can\'t quite get to it. Also, waking up a sleeping alien bat seems like a recipe for "Janitor Gets Rabies (Space Variety)."'),
                talk: (e) => e.showMessage('"Psst. Hey. You up?" The bat\'s ear twitches. One eye opens, glares at you, then closes. Same energy as waking up in the broom closet.')
            }
        ]
    });

    // ========== ROOM 7: OUTPOST ==========
    engine.registerRoom({
        id: 'outpost',
        transition: 'wipe',
        hint: 'Sell your crystal to the alien trader for buckazoids. You will need them in the cantina and the shop.',
        name: 'Frontier Outpost',
        description: 'A ramshackle alien frontier town — Ulence Flats. Odd buildings line a dusty street. A cantina, a trading post, and a landing pad are visible.',
        onEnter: (e) => {
            e.sound.startAmbient('outpost_crowd');
            // AGS-inspired: depth scaling — outdoor town perspective
            e.setDepthScaling(265, 365, 0.7, 1.0);

            // AGI-inspired barriers: fuel barrels, street lamp
            e.addBarrier(190, 290, 45, 15);    // Fuel barrels
            e.addBarrier(396, 290, 10, 15);    // Street lamp pole base

            // Twin suns again, high and right.
            e.setSceneLight(520, 60, 0.65);

            // Near street clutter: a crate stack and a hitching rail the ego can
            // pass behind, so the dusty street reads as three planes deep.
            e.addForegroundLayer(368, (ctx) => {
                // Crate stack, bottom left
                ctx.fillStyle = '#4a3a20';
                ctx.fillRect(8, 344, 74, 56);
                ctx.fillStyle = '#6a5430';
                ctx.fillRect(8, 344, 74, 5);
                ctx.fillRect(8, 344, 5, 56);
                ctx.fillStyle = '#2e2412';
                ctx.fillRect(20, 358, 50, 4);
                ctx.fillRect(20, 380, 50, 4);
                ctx.fillStyle = '#3a2c18';
                ctx.fillRect(30, 322, 52, 24);
                ctx.fillStyle = '#5a4728';
                ctx.fillRect(30, 322, 52, 4);
                // Hitching rail across the near kerb
                ctx.fillStyle = '#3a2c18';
                ctx.fillRect(180, 372, 300, 6);
                ctx.fillRect(196, 372, 8, 28);
                ctx.fillRect(452, 372, 8, 28);
                ctx.fillStyle = '#5a4728';
                ctx.fillRect(180, 372, 300, 2);
                // Dust drift piled against the kerb — dithered and scalloped
                // rather than a flat rectangle, so it doesn't read as a letterbox bar.
                for (let dx = 180; dx < 480; dx += 20) {
                    const bump = 4 + ((dx / 20) % 3) * 2;
                    ditherRect(ctx, dx, 386 - bump, 20, 14 + bump, '#C08A44', '#E0A860', 2);
                }
                ctx.fillStyle = '#F0C078';
                for (let dx = 180; dx < 480; dx += 20) {
                    const bump = 4 + ((dx / 20) % 3) * 2;
                    ctx.fillRect(dx, 386 - bump, 20, 2);
                }
            });

            // AGI-inspired NPC: wandering alien creature (like SQ1's Ulence Flats aliens)
            if (!e.getNPC('outpost_alien')) {
                e.addNPC({
                    id: 'outpost_alien',
                    x: 420, y: 310,
                    motionType: 'wander',
                    stepSize: 1,
                    stepTime: 350,
                    celCount: 2,
                    cycleTime: 400,
                    shadow: { scale: 1.2, rx: 5, ry: 1.4, alpha: 0.22 },
                    draw: (ctx, eng, npc) => {
                        // Small alien creature wandering the street
                        let s = 1.4 * eng.getDepthScale(npc.y);
                        s = Math.round(s * 20) / 20; // Snap scale to 0.05 step intervals to avoid subpixel shimmering
                        const bx = Math.round(npc.x);
                        const by = Math.round(npc.y) + Math.round(Math.sin(eng.animTimer / 300) * 1.5);
                        // Pixel blocks rather than ellipses: curves would anti-alias
                        // against the pixel grid the rest of the art sits on.
                        const blk = (dx, dy, w, h, colour) => {
                            ctx.fillStyle = colour;
                            const x0 = bx + Math.round(dx * s), y0 = by + Math.round(dy * s);
                            ctx.fillRect(x0, y0, Math.round((dx + w) * s) - Math.round(dx * s),
                                Math.round((dy + h) * s) - Math.round(dy * s));
                        };
                        const BODY = '#44AA44', SHADE = '#338833', EDGE = '#3d9a3d';
                        // Body silhouette, built as a stack of bars
                        blk(-3, -19, 6, 2, BODY);
                        blk(-4.5, -17, 9, 2, BODY);
                        blk(-5.5, -15, 11, 3, BODY);
                        blk(-6, -12, 12, 7, BODY);
                        blk(-5.5, -5, 11, 3, BODY);
                        blk(-4.5, -2, 9, 2, BODY);
                        blk(-3, 0, 6, 2, BODY);
                        // Edge shading down both flanks
                        blk(-6, -12, 1, 7, EDGE);
                        blk(5, -12, 1, 7, EDGE);
                        // Belly
                        blk(-3, -11, 6, 2, SHADE);
                        blk(-4, -9, 8, 6, SHADE);
                        blk(-3, -3, 6, 2, SHADE);
                        // Single big eye
                        blk(-2, -16, 4, 1, '#FFFF88');
                        blk(-3, -15, 6, 4, '#FFFF88');
                        blk(-2, -11, 4, 1, '#FFFF88');
                        const look = npc.facing === 'left' ? -1 : 1;
                        blk(-1 + look, -14, 2, 2, '#111111');
                        // Legs (animated)
                        const legOff = npc.cel === 0 ? 1 : -1;
                        blk(-3, 2, 2, 4 + legOff, BODY);
                        blk(1, 2, 2, 4 - legOff, BODY);
                        // Feet
                        blk(-3.5, 6 + legOff, 3, 1.5, SHADE);
                        blk(0.5, 6 - legOff, 3, 1.5, SHADE);
                    }
                });
            }

            // Edge transition: left goes back to cave
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('cave', 560, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Sky
            // Outpost sky (EGA dithered magenta-to-black)
            ditherRect(ctx, 0, 0, w, 80, '#000000', '#AA00AA', 2);
            ditherRect(ctx, 0, 80, w, 80, '#AA00AA', '#AA00AA', 2);

            // Stars in twilight sky
            stars(ctx, w, 160, 31337, 40, 0.65);

            // Moons
            ctx.fillStyle = '#CCBBDD';
            ctx.beginPath(); ctx.arc(100, 50, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#AA99BB';
            ctx.beginPath(); ctx.arc(100, 50, 15, 0.5, 2.5); ctx.fill();

            ctx.fillStyle = '#88AACC';
            ctx.beginPath(); ctx.arc(550, 35, 8, 0, Math.PI * 2); ctx.fill();

            // Ground
            // Outpost ground (EGA dithered brown)
            ditherRect(ctx, 0, 155, w, 245, '#AA5500', '#555555', 2);

            // Road/path
            ctx.fillStyle = '#5a4a32';
            ctx.fillRect(0, 290, w, 110);
            ctx.fillStyle = '#4a3a22';
            ctx.fillRect(0, 340, w, 5);

            // Building 1: Cantina (left)
            ctx.fillStyle = '#000000';
            ctx.fillRect(26, 96, 168, 198);
            ctx.fillStyle = '#554466';
            ctx.fillRect(30, 100, 160, 190);
            ctx.fillStyle = '#40334f';
            ctx.beginPath();
            ctx.moveTo(190, 100); ctx.lineTo(210, 114); ctx.lineTo(210, 284); ctx.lineTo(190, 290);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#776688';
            ctx.beginPath();
            ctx.moveTo(22, 100); ctx.lineTo(45, 88); ctx.lineTo(196, 88); ctx.lineTo(190, 100);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = '#665577';
            ctx.fillRect(35, 105, 150, 145);
            // Bright panel piping gives the facade the graphic readability of
            // classic Sierra space architecture.
            ctx.fillStyle = '#aaaaff';
            ctx.fillRect(35, 104, 150, 4);
            ctx.fillRect(35, 104, 4, 48);
            ctx.fillStyle = '#222244';
            ctx.fillRect(39, 108, 146, 3);
            // Windows
            ctx.fillStyle = '#442244';
            ctx.fillRect(50, 120, 35, 30);
            ctx.fillRect(100, 120, 35, 30);
            ctx.fillRect(150, 120, 25, 30);
            // Warm light in windows
            ctx.fillStyle = 'rgba(255,200,100,0.3)';
            ctx.fillRect(52, 122, 31, 26);
            ctx.fillRect(102, 122, 31, 26);
            // Door
            ctx.fillStyle = '#443355';
            ctx.fillRect(70, 195, 50, 95);
            ctx.fillStyle = '#CCAA33';
            ctx.fillRect(115, 240, 4, 4);
            // Sign board mounted above the door
            const neonBlink = Math.floor(eng.animTimer / 400) % 3;
            ctx.fillStyle = '#241a2e';
            ctx.fillRect(38, 158, 116, 34);
            ctx.fillStyle = '#160f1d';
            ctx.fillRect(40, 160, 112, 30);
            // Mounting brackets
            ctx.fillStyle = '#443355';
            ctx.fillRect(48, 154, 4, 6);
            ctx.fillRect(140, 154, 4, 6);
            // Neon glow behind text
            if (neonBlink !== 2) {
                ctx.fillStyle = 'rgba(255,60,60,0.20)';
                ctx.fillRect(40, 160, 112, 30);
            }
            ctx.fillStyle = neonBlink !== 2 ? '#FF6666' : '#7a3333';
            ctx.font = sceneFont(13, 'bold');
            ctx.fillText("ALE-IEN'S", 48, 178);
            ctx.fillStyle = neonBlink !== 2 ? '#FFAA88' : '#7a5544';
            ctx.font = sceneFont(7);
            ctx.fillText('CANTINA', 48, 187);

            // Building 2: Shop (center)
            ctx.fillStyle = '#000000';
            ctx.fillRect(226, 116, 158, 178);
            ctx.fillStyle = '#556644';
            ctx.fillRect(230, 120, 150, 170);
            ctx.fillStyle = '#3d4b31';
            ctx.beginPath();
            ctx.moveTo(380, 120); ctx.lineTo(398, 132); ctx.lineTo(398, 282); ctx.lineTo(380, 290);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#7b8a62';
            ctx.beginPath();
            ctx.moveTo(222, 120); ctx.lineTo(242, 108); ctx.lineTo(386, 108); ctx.lineTo(380, 120);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = '#667755';
            ctx.fillRect(235, 125, 140, 120);
            ctx.fillStyle = '#ccdd55';
            ctx.fillRect(235, 151, 140, 3);
            ctx.fillRect(372, 151, 3, 92);
            // Storefront sign board mounted under the roofline
            ctx.fillStyle = '#2e2416';
            ctx.fillRect(236, 123, 138, 28);
            ctx.fillStyle = '#4a3c22';
            ctx.fillRect(238, 125, 134, 24);
            ctx.fillStyle = '#6a5730';
            ctx.fillRect(238, 125, 134, 2);
            // Mounting bolts
            ctx.fillStyle = '#888877';
            ctx.fillRect(242, 128, 2, 2);
            ctx.fillRect(368, 128, 2, 2);
            ctx.fillStyle = '#CCCC44';
            ctx.font = sceneFont(11, 'bold');
            ctx.fillText("TINY'S TRADING", 246, 139);
            ctx.fillStyle = '#99AA55';
            ctx.font = sceneFont(8);
            ctx.fillText('TRADING POST', 258, 148);
            // Window / display
            ctx.fillStyle = '#334433';
            ctx.fillRect(250, 158, 100, 40);
            // Items in display
            ctx.fillStyle = '#888899';
            ctx.fillRect(265, 174, 20, 15);
            ctx.fillStyle = '#AA8833';
            ctx.fillRect(300, 172, 15, 18);
            ctx.fillStyle = '#CC4444';
            ctx.fillRect(330, 176, 10, 12);
            // Door
            ctx.fillStyle = '#445533';
            ctx.fillRect(280, 205, 50, 85);

            // Landing pad (right) — raised platform in perspective
            // Open supports and cross-bracing make this a raised dock rather
            // than a painted shape on the sand.
            ctx.fillStyle = '#000000';
            ctx.fillRect(448, 276, 17, 72); ctx.fillRect(596, 276, 18, 72);
            ctx.fillStyle = '#41415a';
            ctx.fillRect(452, 280, 10, 64); ctx.fillRect(600, 280, 10, 64);
            ctx.strokeStyle = '#000000'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(462, 286); ctx.lineTo(600, 338); ctx.moveTo(600, 286); ctx.lineTo(462, 338); ctx.stroke();
            ctx.strokeStyle = '#6f6f91'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(462, 286); ctx.lineTo(600, 338); ctx.moveTo(600, 286); ctx.lineTo(462, 338); ctx.stroke();
            ctx.lineWidth = 1;
            // Support base / shadow
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(458, 196); ctx.lineTo(604, 196); ctx.lineTo(632, 280); ctx.lineTo(432, 280);
            ctx.closePath(); ctx.fill();
            // Platform surface (trapezoid, wider at the front)
            ctx.fillStyle = '#4a4a58';
            ctx.beginPath();
            ctx.moveTo(462, 200); ctx.lineTo(600, 200); ctx.lineTo(626, 276); ctx.lineTo(436, 276);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#aaaaff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.fillStyle = '#161629';
            ctx.fillRect(438, 280, 190, 14);
            // Inner deck panel
            ctx.fillStyle = '#565667';
            ctx.beginPath();
            ctx.moveTo(474, 208); ctx.lineTo(588, 208); ctx.lineTo(608, 268); ctx.lineTo(454, 268);
            ctx.closePath(); ctx.fill();
            // Circular landing marker with cross-hair
            ctx.strokeStyle = '#FFEE55';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(531, 240, 40, 19, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(531, 240, 25, 12, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(531, 223); ctx.lineTo(531, 257); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(495, 240); ctx.lineTo(567, 240); ctx.stroke();
            ctx.lineWidth = 1;
            // Hazard chevrons along the front edge
            for (let i = 0; i < 10; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#FFCC00' : '#222222';
                const cxh = 436 + i * 19;
                ctx.beginPath();
                ctx.moveTo(cxh, 276); ctx.lineTo(cxh + 12, 276); ctx.lineTo(cxh + 6, 269); ctx.closePath();
                ctx.fill();
            }
            // Blinking corner beacons
            const padBlink = Math.floor(eng.animTimer / 500) % 2 === 0;
            [[466, 204], [596, 204], [610, 270], [452, 270]].forEach(([lx, ly], i) => {
                const warm = (i % 2 === 0) === padBlink;
                ctx.fillStyle = warm ? 'rgba(255,80,60,0.25)' : 'rgba(100,255,100,0.25)';
                ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = warm ? '#FF5544' : '#66FF66';
                ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI * 2); ctx.fill();
            });
            // Ship on pad (if nav chip used)
            if (!eng.getFlag('flew_away')) {
                // Same cargo shuttle as the flight cinematic, parked nose-right
                // on its gear: swept fin, orange stripe, cyan canopy, twin bells.
                ctx.fillStyle = CRAFT.edge;
                ctx.beginPath();
                ctx.moveTo(480, 210); ctx.lineTo(500, 192); ctx.lineTo(560, 190);
                ctx.lineTo(582, 202); ctx.lineTo(590, 214); ctx.lineTo(578, 230);
                ctx.lineTo(500, 236); ctx.lineTo(480, 226);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.hi;
                ctx.beginPath();
                ctx.moveTo(485, 211); ctx.lineTo(502, 196); ctx.lineTo(558, 194);
                ctx.lineTo(578, 204); ctx.lineTo(585, 214); ctx.lineTo(504, 216);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.mid;
                ctx.beginPath();
                ctx.moveTo(485, 213); ctx.lineTo(585, 215); ctx.lineTo(574, 227);
                ctx.lineTo(502, 232);
                ctx.closePath(); ctx.fill();
                // Dorsal fin
                ctx.fillStyle = CRAFT.edge;
                ctx.beginPath();
                ctx.moveTo(508, 194); ctx.lineTo(524, 174); ctx.lineTo(546, 174);
                ctx.lineTo(540, 194);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.lo;
                ctx.beginPath();
                ctx.moveTo(512, 193); ctx.lineTo(526, 177); ctx.lineTo(542, 177);
                ctx.lineTo(537, 193);
                ctx.closePath(); ctx.fill();
                // Near wing sweeping down toward the deck
                ctx.fillStyle = CRAFT.edge;
                ctx.beginPath();
                ctx.moveTo(504, 224); ctx.lineTo(482, 246); ctx.lineTo(522, 248);
                ctx.lineTo(538, 228);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.lo;
                ctx.beginPath();
                ctx.moveTo(506, 226); ctx.lineTo(489, 243); ctx.lineTo(519, 245);
                ctx.lineTo(532, 229);
                ctx.closePath(); ctx.fill();
                // Emergency stripe and hull seam
                ctx.fillStyle = CRAFT.accent;
                ctx.fillRect(524, 205, 4, 22);
                ctx.strokeStyle = CRAFT.lo;
                ctx.beginPath(); ctx.moveTo(492, 214); ctx.lineTo(578, 216); ctx.stroke();
                // Canopy
                ctx.fillStyle = CRAFT.edge;
                ctx.beginPath();
                ctx.moveTo(552, 198); ctx.lineTo(574, 202); ctx.lineTo(582, 212);
                ctx.lineTo(552, 212);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.glass;
                ctx.beginPath();
                ctx.moveTo(555, 201); ctx.lineTo(571, 204); ctx.lineTo(577, 210);
                ctx.lineTo(555, 210);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = CRAFT.spec;
                ctx.fillRect(557, 203, 8, 2);
                // Twin engine bells, aft
                ctx.fillStyle = CRAFT.edge;
                ctx.fillRect(474, 204, 10, 12);
                ctx.fillRect(474, 218, 10, 12);
                ctx.fillStyle = CRAFT.lo;
                ctx.fillRect(477, 206, 6, 8);
                ctx.fillRect(477, 220, 6, 8);
                // Landing gear
                ctx.fillStyle = CRAFT.edge;
                ctx.fillRect(500, 232, 4, 16);
                ctx.fillRect(494, 246, 16, 4);
                ctx.fillRect(566, 228, 4, 20);
                ctx.fillRect(560, 246, 16, 4);
            }
            // Landing pad sign on a post
            ctx.fillStyle = '#556';
            ctx.fillRect(456, 252, 4, 30);
            ctx.fillStyle = '#33404a';
            ctx.fillRect(424, 234, 66, 18);
            ctx.fillStyle = '#7c8b9a';
            ctx.fillRect(426, 236, 62, 14);
            ctx.fillStyle = '#11202a';
            ctx.font = sceneFont(8, 'bold');
            ctx.fillText('LANDING PAD A', 428, 246);

            // Misc details
            // Barrel with label
            ctx.fillStyle = '#665544';
            ctx.fillRect(210, 280, 18, 22);
            ctx.fillStyle = '#776655';
            ctx.fillRect(212, 283, 14, 2);
            ctx.fillRect(212, 295, 14, 2);
            ctx.fillStyle = '#883322';
            ctx.font = '5px "Courier New"';
            ctx.fillText('FUEL', 212, 292);

            // Second barrel
            ctx.fillStyle = '#556644';
            ctx.fillRect(195, 282, 14, 18);
            ctx.fillStyle = '#667755';
            ctx.fillRect(196, 285, 12, 2);
            ctx.fillRect(196, 293, 12, 2);

            // Alien creature in background - more detail
            ctx.fillStyle = '#889977';
            ctx.fillRect(420, 275, 10, 22);
            // Head with antennae
            ctx.beginPath();
            ctx.arc(425, 270, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#99AA88';
            ctx.fillRect(422, 260, 2, 10);
            ctx.fillRect(428, 258, 2, 12);
            ctx.fillStyle = '#CCDD88';
            ctx.fillRect(421, 258, 4, 3);
            ctx.fillRect(427, 256, 4, 3);
            // Eyes
            ctx.fillStyle = '#112211';
            ctx.fillRect(422, 268, 3, 3);
            ctx.fillRect(428, 268, 3, 3);
            // Legs
            ctx.fillStyle = '#889977';
            ctx.fillRect(420, 297, 4, 8);
            ctx.fillRect(426, 297, 4, 8);

            // Street lamp
            ctx.fillStyle = '#555555';
            ctx.fillRect(400, 155, 4, 145);
            ctx.fillStyle = '#666666';
            ctx.fillRect(393, 152, 18, 6);
            // Lamp glow
            const lampGlow = 0.6 + Math.sin(eng.animTimer / 800) * 0.2;
            ctx.fillStyle = `rgba(255,200,100,${lampGlow})`;
            ctx.fillRect(396, 148, 12, 5);
            ctx.fillStyle = `rgba(255,200,100,${lampGlow * 0.08})`;
            ctx.beginPath(); ctx.arc(402, 170, 25, 0, Math.PI * 2); ctx.fill();

            // Debris/litter on ground
            ctx.fillStyle = '#5a4a32';
            ctx.fillRect(320, 350, 8, 4);
            ctx.fillRect(480, 358, 6, 3);
            ctx.fillStyle = '#6a5a42';
            ctx.fillRect(150, 355, 10, 3);

            // Wanted poster on cantina wall (beside the door, at eye level)
            ctx.fillStyle = '#CCBB88';
            ctx.fillRect(134, 206, 24, 34);
            ctx.fillStyle = '#a89968';
            ctx.fillRect(134, 206, 24, 2);
            ctx.fillStyle = '#332222';
            ctx.font = '5px "Courier New"';
            ctx.fillText('WANTED', 137, 214);
            ctx.fillStyle = '#AA8866';
            ctx.fillRect(139, 217, 14, 13);
            ctx.fillStyle = '#332222';
            ctx.font = '5px "Courier New"';
            ctx.fillText('$5000', 137, 238);

            // Alien graffiti on shop wall
            ctx.fillStyle = 'rgba(200,100,200,0.3)';
            ctx.font = '8px "Courier New"';
            ctx.fillText('ZQRX WUZ HERE', 240, 260);

            // Tire tracks
            ctx.fillStyle = 'rgba(60,50,30,0.2)';
            ctx.fillRect(0, 320, w, 3);
            ctx.fillRect(0, 328, w, 2);

            // Docking Bay B — signposted like the other destinations so the
            // rescue route is not the weakest affordance on the busiest screen.
            ctx.fillStyle = '#4a3a28';
            ctx.fillRect(608, 255, 32, 145);
            // Rough track leading off toward the bay
            ctx.fillStyle = '#6b5638';
            ctx.beginPath();
            ctx.moveTo(508, 400); ctx.lineTo(598, 306); ctx.lineTo(640, 306); ctx.lineTo(640, 400);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(60,50,30,0.22)';
            ctx.fillRect(566, 356, 74, 3);
            // Signboard on a post
            ctx.fillStyle = '#556';
            ctx.fillRect(590, 330, 5, 26);
            ctx.fillStyle = '#33404a';
            ctx.fillRect(546, 298, 94, 34);
            ctx.fillStyle = '#7c8b9a';
            ctx.fillRect(548, 300, 90, 30);
            ctx.fillStyle = '#11202a';
            ctx.font = sceneFont(8, 'bold');
            ctx.fillText('DOCKING BAY B', 552, 313);
            ctx.font = sceneFont(7);
            ctx.fillText('WRECK ZONE', 552, 325);
            // Arrow pointing down the track
            ctx.fillStyle = '#88AACC';
            ctx.beginPath();
            ctx.moveTo(624, 340); ctx.lineTo(636, 346); ctx.lineTo(624, 352);
            ctx.closePath(); ctx.fill();
        },
        hotspots: [
            {
                name: 'Cantina', x: 25, y: 95, w: 170, h: 200, isExit: true, walkToX: 95, walkToY: 285,
                description: 'The local cantina. Looks lively inside.',
                look: (e) => e.showMessage('A dimly lit cantina — the social hub of this frontier outpost. Warm light spills from the windows and you can hear alien music. A flickering neon sign reads "ALE-IEN\'S" above the door. Subtle.'),
                onExit: (e) => e.goToRoom('cantina', 320, 310)
            },
            {
                name: 'Trading Post', x: 225, y: 115, w: 160, h: 180, isExit: true, walkToX: 305, walkToY: 285,
                description: 'An alien trading post.',
                look: (e) => e.showMessage('Tiny\'s Trading Post. The display window shows weapons, ship parts, survival gear, and several objects that may be illegal in civilized systems. You might find something useful here.'),
                onExit: (e) => e.goToRoom('shop', 320, 310)
            },
            {
                name: 'Landing Pad', x: 435, y: 155, w: 190, h: 140,
                description: 'A landing platform with a ship.',
                look: (e) => {
                    if (e.getFlag('flew_away')) {
                        e.showMessage('The landing pad is empty.');
                    } else {
                        e.showMessage('A small cargo shuttle sits on the landing pad. It looks spaceworthy. If only you had navigation coordinates, you could fly it...');
                    }
                },
                use: (e) => {
                    if (e.getFlag('flew_away')) {
                        e.showMessage('The ship is gone.');
                    } else if (e.hasItem('nav_chip')) {
                        // Warn about missing weapon
                        if (!e.hasItem('pulsar_ray') && !e.getFlag('shuttle_warn_ray')) {
                            e.showMessage('Somewhere in the back of your mind, a save disk clears its throat. Flying unarmed at a warship is bold. So is juggling reactor rods.');
                            e.setFlag('shuttle_warn_ray');
                            return;
                        }
                        if (!e.hasItem('pulsar_ray')) {
                            e.setFlag('flew_unarmed');
                            e.showMessage('You ignore the raised eyebrow and launch anyway. Somewhere, a parser smiles thinly.');
                        } else {
                            e.showMessage('You load the nav chip into the shuttle\'s computer. Coordinates to the Draknoid flagship locked in! The engines roar to life and you blast off into space...');
                        }
                        engine.sound.hyperspace();
                        e.setFlag('flew_away');
                        e.addScore(15);
                        e.playCutscene({
                            duration: 6000,
                            draw: cutsceneShuttleFlight,
                            onEnd: () => e.goToRoom('draknoid_ship', 100, 310),
                            skippable: true
                        });
                    } else {
                        e.showMessage('The nav computer blinks expectantly. It has no idea where to go.');
                    }
                },
                useItem: (e, itemId) => {
                    if (e.getFlag('flew_away')) {
                        e.showMessage('The ship is already gone.');
                        return;
                    }
                    if (itemId === 'nav_chip') {
                        // Warn about missing weapon
                        if (!e.hasItem('pulsar_ray') && !e.getFlag('shuttle_warn_ray')) {
                            e.showMessage('Somewhere in the back of your mind, a save disk clears its throat. Flying unarmed at a warship is bold. So is juggling reactor rods.');
                            e.setFlag('shuttle_warn_ray');
                            return;
                        }
                        if (!e.hasItem('pulsar_ray')) {
                            e.setFlag('flew_unarmed');
                            e.showMessage('You ignore the raised eyebrow and launch anyway. Somewhere, a parser smiles thinly.');
                        } else {
                            e.showMessage('You insert the nav chip into the shuttle\'s navigation computer. Coordinates locked — destination: Draknoid Flagship! You strap in and blast off!');
                        }
                        engine.sound.hyperspace();
                        e.setFlag('flew_away');
                        e.addScore(15);
                        e.playCutscene({
                            duration: 6000,
                            draw: cutsceneShuttleFlight,
                            onEnd: () => e.goToRoom('draknoid_ship', 100, 310),
                            skippable: true
                        });
                    } else {
                        e.showMessage('That won\'t help fly the ship.');
                    }
                }
            },
            {
                name: 'Cave Tunnel', x: 0, y: 270, w: 30, h: 130, isExit: true, walkToX: 30,
                description: 'The tunnel back to the cave.',
                look: (e) => e.showMessage('The dark tunnel leading back to the crystal cave. You can see a faint blue glow from deep within.'),
                onExit: (e) => e.goToRoom('cave', 560, 310)
            },
            {
                name: 'Alien Creature',
                // Dynamic hotspot that tracks the wandering NPC position
                get x() { const npc = engine.getNPC('outpost_alien'); return npc ? npc.x - 12 : 410; },
                get y() { const npc = engine.getNPC('outpost_alien'); return npc ? npc.y - 40 : 252; },
                w: 25, h: 55,
                description: 'A small alien creature loitering nearby.',
                look: (e) => e.showMessage('A small, slug-like alien with two bobbing antennae and bulbous compound eyes. It seems to be loitering near the landing pad with no particular purpose. Relatable.'),
                get: (e) => e.showMessage('You reach for the creature. It hisses and slaps your hand with an antenna. "OW!" It goes back to loitering, smugly.'),
                talk: (e) => e.showMessage('"Blrrp," says the creature. You nod sagely. "Blrrp indeed," you reply. You\'ve exhausted the conversation.'),
                use: (e) => e.showMessage('The creature looks at you suspiciously. You look at it suspiciously. Neither of you makes a move. It\'s a standoff.')
            },
            {
                name: 'Wanted Poster', x: 131, y: 203, w: 30, h: 40,
                description: 'A wanted poster on the cantina wall.',
                look: (e) => { if (!engine.getFlag('looked_wanted_poster')) { engine.setFlag('looked_wanted_poster'); e.addScore(3); } e.showMessage('"WANTED: ZQRX THE DEFACER — Crimes Against Public Property." The sketch looks like a blob with arms. Reward: 5 buckazoids. Not exactly a high-priority criminal.'); },
                get: (e) => e.showMessage('You peel the poster off the wall. It tears. You stick it back. Hide the evidence. Act natural.'),
                talk: (e) => e.showMessage('"ZQRX, if you\'re out there — the graffiti isn\'t that bad. I\'ve seen worse." You have seen worse. YOU\'VE done worse.')
            },
            {
                name: 'Fuel Barrels', x: 190, y: 278, w: 42, h: 28,
                description: 'Fuel barrels stacked by the landing pad.',
                look: (e) => e.showMessage('Standard-issue fuel drums, one labeled "FUEL" in Universal Basic, the other in some alien script. They smell like a mixture of gasoline and burnt cinnamon. Alien fuel is weird.'),
                get: (e) => e.showMessage('Each barrel weighs about 200 kilos. Your janitor back can barely handle the mop bucket. Hard pass.'),
                use: (e) => e.showMessage('Without proper fueling equipment, you\'d just end up covered in alien fuel. And that smell does NOT wash out — trust your janitor nose.')
            },
            {
                name: 'Graffiti', x: 235, y: 248, w: 120, h: 16,
                description: 'Alien graffiti sprayed on the wall.',
                look: (e) => e.showMessage('"ZQRX WUZ HERE" — scrawled in luminescent paint. As a sanitation professional, you disapprove. But you also appreciate the craftsmanship. Good coverage, even strokes. ZQRX takes pride in their vandalism.'),
                use: (e) => e.showMessage('You instinctively reach for your cleaning supplies before remembering they\'re on a dying spaceship several million miles away.')
            },
            {
                name: 'Docking Bay',
                x: 546, y: 296, w: 94, h: 104, isExit: true, walkToX: 590, walkToY: 340,
                description: 'A side road leading to the docking bay. A hand-painted sign reads "DOCKING BAY B — WRECK ZONE."',
                look: (e) => e.showMessage('A narrow track leads around the back of the outpost buildings to the secondary docking bay. Someone spray-painted "WRECK ZONE" over the official sign.'),
                onExit: (e) => e.goToRoom('docking_bay', 60, 340)
            }
        ]
    });

    // ========== ROOM 8: CANTINA ==========
    engine.registerRoom({
        id: 'cantina',
        hint: (e) => {
            if (!e.hasItem('drink')) return 'Buy a Keronian Ale at the bar.';
            if (!e.hasItem('nav_chip')) return 'The pilot at the back will trade a nav chip for a drink. Use the ale on him.';
            return 'You have what you need here. Try the shop next door for a weapon.';
        },
        name: 'Cantina',
        description: 'The cantina is smoky and dim. Alien music plays from somewhere questionable. A three-eyed bartender polishes glasses with three hands. A crystalline being hums at the bar. An insectoid clicks over a fizzing drink. A purple blob watches you with its one big eye. A weary pilot nurses an empty glass. You feel extremely smoothskin.',
        onEnter: (e) => {
            e.sound.startAmbient('cantina_music');
            // Sierra pseudo-3D: floor begins at y=250 behind the bar.
            e.setDepthScaling(258, 378, 0.7, 1.0);
            // AGI-inspired barriers: bar counter, tables, stools
            e.addBarrier(20, 250, 320, 20);    // Bar counter front face
            e.addBarrier(415, 280, 85, 12);    // Table 1
            e.addBarrier(525, 295, 85, 12);    // Table 2

            // Foreground layer: bar counter top draws over player walking behind
            e.addForegroundLayer(270, (ctx) => {
                // Bar counter top lip
                ctx.fillStyle = '#775544';
                ctx.fillRect(28, 250, 305, 4);
            });

            // Edge transition: left exits to outpost
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('outpost', 95, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Recessed cantina shell with a low vanishing point behind the bar.
            ctx.fillStyle = '#120912';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#481326';
            ctx.fillRect(92, 34, 456, 216);
            ditherRect(ctx, 108, 44, 424, 24, '#2b0c1b', '#641a31', 4);
            ctx.fillStyle = '#260f22';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(92, 34); ctx.lineTo(92, 250); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(548, 34); ctx.lineTo(548, 250); ctx.lineTo(w, 400);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0c070d';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(548, 34); ctx.lineTo(92, 34);
            ctx.closePath(); ctx.fill();

            perspectiveFloor(ctx, 250, w, h, '#1e1018', '#3a1b2b');

            // Recessed wall bays and converging trim keep the room legible as
            // a deep tavern rather than a row of sprites on a flat backdrop.
            ctx.strokeStyle = '#6b2940';
            ctx.beginPath();
            ctx.moveTo(92, 34); ctx.lineTo(150, 250);
            ctx.moveTo(548, 34); ctx.lineTo(510, 250);
            ctx.stroke();
            ctx.fillStyle = '#31101f';
            ctx.fillRect(350, 74, 72, 64);
            ctx.fillStyle = '#180b15';
            ctx.fillRect(356, 80, 60, 52);
            ctx.fillStyle = '#7a2942';
            ctx.fillRect(356, 80, 60, 3);
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#a85973';
            ctx.fillText('NO CREDIT', 365, 94);
            ctx.fillText('NO OXYGEN', 362, 105);
            ctx.fillText('NO PROBLEM', 362, 116);

            // Low amber table light pools add the moody pools of colour common
            // to VGA-era painted backgrounds without smoothing the pixel art.
            ctx.fillStyle = 'rgba(220,110,45,0.06)';
            ctx.beginPath(); ctx.ellipse(462, 276, 66, 24, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(145,70,210,0.05)';
            ctx.beginPath(); ctx.ellipse(565, 300, 62, 28, 0, 0, Math.PI * 2); ctx.fill();

            // Bar counter (back)
            ctx.fillStyle = '#553322';
            ctx.fillRect(30, 130, 300, 15);
            // Bar front
            ctx.fillStyle = '#664433';
            ctx.fillRect(20, 140, 320, 110);
            ctx.fillStyle = '#553322';
            ctx.fillRect(25, 145, 310, 100);

            // Bottles behind bar
            const bottleColors = ['#CC3333', '#33CC33', '#3333CC', '#CCCC33', '#CC33CC', '#33CCCC', '#FF8800', '#8800FF'];
            bottleColors.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.fillRect(50 + i * 35, 95, 10, 30);
                ctx.fillStyle = '#888';
                ctx.fillRect(52 + i * 35, 90, 6, 8);
            });

            // Shelf behind bar
            ctx.fillStyle = '#443322';
            ctx.fillRect(30, 90, 300, 4);
            ctx.fillRect(30, 60, 300, 4);

            // Irregular silhouettes stop the shelves looking like a colour
            // swatch while keeping every prop chunky and readable.
            ctx.fillStyle = '#99dd66';
            ctx.fillRect(70, 75, 7, 15); ctx.fillRect(72, 71, 3, 4);
            ctx.fillStyle = '#dd77aa';
            ctx.fillRect(285, 68, 12, 22); ctx.fillRect(289, 64, 4, 4);
            ctx.fillStyle = '#66aadd';
            ctx.beginPath(); ctx.moveTo(115, 90); ctx.lineTo(119, 72); ctx.lineTo(127, 72); ctx.lineTo(131, 90); ctx.closePath(); ctx.fill();

            // Bar stools
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = '#444';
                ctx.fillRect(60 + i * 70, 255, 4, 35);
                ctx.fillStyle = '#663333';
                ctx.fillRect(50 + i * 70, 250, 24, 10);
            }

            // Bartender - detailed multi-armed alien
            // Body - thick torso
            ctx.fillStyle = '#55AA55';
            ctx.fillRect(178, 100, 34, 35);
            // Apron
            ctx.fillStyle = '#CCBB99';
            ctx.fillRect(182, 110, 26, 25);
            ctx.fillStyle = '#BBAA88';
            ctx.fillRect(190, 107, 10, 4); // apron strap
            // Apron stain
            ctx.fillStyle = '#AA9977';
            ctx.fillRect(188, 120, 4, 4);
            // Head - bulbous alien
            ctx.fillStyle = '#44AA88';
            ctx.fillRect(181, 65, 28, 35);
            // Head shape - wider at top
            ctx.fillStyle = '#44AA88';
            ctx.fillRect(178, 68, 34, 20);
            // Skin texture spots
            ctx.fillStyle = '#33AA77';
            ctx.fillRect(183, 72, 3, 3);
            ctx.fillRect(199, 78, 3, 3);
            ctx.fillRect(190, 88, 2, 2);
            // Eyes (alien - three big eyes with pupils)
            // Left eye
            ctx.fillStyle = '#DDDD55';
            ctx.fillRect(184, 76, 6, 5);
            ctx.fillStyle = '#111100';
            ctx.fillRect(186, 77, 3, 3);
            // Right eye
            ctx.fillStyle = '#DDDD55';
            ctx.fillRect(200, 76, 6, 5);
            ctx.fillStyle = '#111100';
            ctx.fillRect(202, 77, 3, 3);
            // Bottom eye (between and below)
            ctx.fillStyle = '#DDDD55';
            ctx.fillRect(192, 84, 6, 4);
            ctx.fillStyle = '#111100';
            ctx.fillRect(194, 85, 3, 2);
            // Mouth - wide alien grin
            ctx.fillStyle = '#337755';
            ctx.fillRect(188, 92, 14, 3);
            ctx.fillStyle = '#226644';
            ctx.fillRect(189, 93, 12, 1);
            // Brow ridge
            ctx.fillStyle = '#339966';
            ctx.fillRect(183, 74, 8, 2);
            ctx.fillRect(199, 74, 8, 2);
            // Bartender arms (three pairs!)
            ctx.fillStyle = '#55AA55';
            // Upper arms
            ctx.fillRect(168, 102, 10, 18);
            ctx.fillRect(212, 102, 10, 18);
            // Middle arms (polishing glass)
            ctx.fillRect(165, 115, 13, 20);
            ctx.fillRect(212, 115, 13, 20);
            // Lower arms (on counter)
            ctx.fillRect(170, 128, 8, 12);
            ctx.fillRect(212, 128, 8, 12);
            // Hands
            ctx.fillStyle = '#44AA88';
            ctx.fillRect(166, 119, 8, 5); // holding glass
            ctx.fillRect(168, 135, 10, 6);
            ctx.fillRect(213, 119, 8, 5);
            ctx.fillRect(212, 135, 10, 6);
            // Glass being polished
            ctx.fillStyle = 'rgba(180,180,220,0.4)';
            ctx.fillRect(160, 110, 8, 12);
            ctx.fillStyle = 'rgba(160,160,200,0.3)';
            ctx.fillRect(162, 108, 4, 3);
            // Polishing cloth
            ctx.fillStyle = '#CCBB99';
            ctx.fillRect(214, 117, 10, 8);

            // Tables
            // Table 1 with patron (alien pilot)
            ctx.fillStyle = '#443322';
            ctx.fillRect(420, 240, 80, 6);
            ctx.fillRect(450, 246, 6, 40);
            ctx.fillRect(490, 246, 6, 40);

            // Alien pilot at table
            if (!eng.getFlag('pilot_left')) {
                // Body (seated) - leather flight jacket
                ctx.fillStyle = '#664422';
                ctx.fillRect(438, 200, 30, 40);
                // Jacket collar
                ctx.fillStyle = '#775533';
                ctx.fillRect(436, 200, 34, 5);
                // Jacket lapels
                ctx.fillStyle = '#553311';
                ctx.fillRect(440, 205, 4, 12);
                ctx.fillRect(462, 205, 4, 12);
                // Mission patches on jacket
                ctx.fillStyle = '#CC4444';
                ctx.fillRect(440, 208, 6, 6); // red patch
                ctx.fillStyle = '#4444CC';
                ctx.fillRect(460, 214, 6, 5); // blue patch
                // Tiny star on red patch
                ctx.fillStyle = '#FFDD44';
                ctx.fillRect(442, 210, 2, 2);
                // Jacket zipper
                ctx.fillStyle = '#888866';
                ctx.fillRect(452, 205, 1, 30);
                // Head - alien with rough skin
                ctx.fillStyle = '#AA6655';
                ctx.fillRect(443, 172, 22, 28);
                // Alien skin texture
                ctx.fillStyle = '#996655';
                ctx.fillRect(446, 180, 2, 2);
                ctx.fillRect(458, 176, 2, 2);
                // Pilot goggles pushed up on forehead
                ctx.fillStyle = '#334455';
                ctx.fillRect(444, 174, 20, 6);
                ctx.fillStyle = '#446688';
                ctx.fillRect(446, 175, 7, 4);
                ctx.fillRect(455, 175, 7, 4);
                // Goggle reflection
                ctx.fillStyle = '#5588AA';
                ctx.fillRect(447, 175, 2, 2);
                ctx.fillRect(456, 175, 2, 2);
                // Goggle strap
                ctx.fillStyle = '#222222';
                ctx.fillRect(443, 176, 2, 3);
                ctx.fillRect(465, 176, 2, 3);
                // Eyes (two, slightly bloodshot)
                ctx.fillStyle = '#DDCCBB';
                ctx.fillRect(448, 183, 5, 4);
                ctx.fillRect(457, 183, 5, 4);
                ctx.fillStyle = '#884422';
                ctx.fillRect(450, 184, 3, 2);
                ctx.fillRect(459, 184, 3, 2);
                ctx.fillStyle = '#221100';
                ctx.fillRect(451, 184, 1, 2);
                ctx.fillRect(460, 184, 1, 2);
                // Nose ridge
                ctx.fillStyle = '#996655';
                ctx.fillRect(454, 186, 2, 4);
                // Mouth/expression (weary frown)
                ctx.fillStyle = '#884433';
                ctx.fillRect(450, 192, 10, 2);
                ctx.fillStyle = '#773322';
                ctx.fillRect(449, 191, 2, 1);
                ctx.fillRect(460, 191, 2, 1);
                // Stubble/beard shadow
                ctx.fillStyle = 'rgba(40,30,20,0.3)';
                ctx.fillRect(446, 190, 16, 8);
                // Scarf around neck
                ctx.fillStyle = '#CC6633';
                ctx.fillRect(440, 198, 28, 4);
                ctx.fillStyle = '#BB5522';
                ctx.fillRect(445, 199, 3, 3); // scarf fold
                // Arms on table
                ctx.fillStyle = '#664422';
                ctx.fillRect(430, 232, 18, 6);
                ctx.fillRect(465, 232, 18, 6);
                // Hands
                ctx.fillStyle = '#AA6655';
                ctx.fillRect(428, 232, 5, 6);
                ctx.fillRect(482, 232, 5, 6);
                // Empty glass - more detailed
                ctx.fillStyle = 'rgba(160,160,210,0.3)';
                ctx.fillRect(488, 228, 12, 14);
                ctx.fillStyle = 'rgba(140,140,190,0.2)';
                ctx.fillRect(490, 226, 8, 3);
                // Ring stain from glass
                ctx.fillStyle = 'rgba(60,60,80,0.15)';
                ctx.beginPath(); ctx.arc(494, 240, 7, 0, Math.PI * 2); ctx.fill();
            }

            // Table 2 (Blorp the tentacled blob patron)
            ctx.fillStyle = '#443322';
            ctx.fillRect(530, 260, 80, 6);
            ctx.fillRect(560, 266, 6, 40);
            // Blorp: squishy purple blob with 4 tentacles clutching a glowing glass
            {
                const blorpBob = Math.sin(eng.animTimer / 600) * 1.5;
                const bx = 555, by = 225 + blorpBob;
                // Body (ellipse-ish blob)
                ctx.fillStyle = '#8844AA';
                ctx.beginPath(); ctx.ellipse(bx, by + 12, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#AA55CC';
                ctx.beginPath(); ctx.ellipse(bx - 4, by + 8, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
                // Single huge eye
                ctx.fillStyle = '#FFFFCC';
                ctx.beginPath(); ctx.arc(bx, by + 6, 8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#331133';
                ctx.beginPath(); ctx.arc(bx + Math.sin(eng.animTimer/900) * 2, by + 6, 4, 0, Math.PI * 2); ctx.fill();
                // Tentacles drooping onto table, wiggling
                ctx.strokeStyle = '#663388';
                ctx.lineWidth = 3;
                for (let t = 0; t < 4; t++) {
                    const wig = Math.sin(eng.animTimer / 400 + t) * 3;
                    ctx.beginPath();
                    ctx.moveTo(bx - 18 + t * 12, by + 26);
                    ctx.quadraticCurveTo(bx - 20 + t * 13 + wig, by + 38, bx - 22 + t * 14, by + 42);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
                // Glowing drink on table
                const drinkGlow = 0.5 + Math.sin(eng.animTimer / 250) * 0.3;
                ctx.fillStyle = `rgba(80,255,120,${drinkGlow})`;
                ctx.fillRect(548, 256, 10, 8);
                ctx.fillStyle = `rgba(180,255,180,${drinkGlow * 0.8})`;
                ctx.fillRect(549, 254, 8, 3);
            }

            // Skritch the insectoid at the far back barstool
            {
                const sx = 268, sy = 232;
                // Thorax
                ctx.fillStyle = '#226622';
                ctx.fillRect(sx - 8, sy, 16, 18);
                // Head
                ctx.fillStyle = '#338833';
                ctx.fillRect(sx - 6, sy - 12, 12, 12);
                // Compound eyes (two big bulging spheres)
                ctx.fillStyle = '#CC2200';
                ctx.beginPath(); ctx.arc(sx - 4, sy - 8, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(sx + 4, sy - 8, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,180,80,0.8)';
                ctx.fillRect(sx - 5, sy - 9, 1, 1);
                ctx.fillRect(sx + 3, sy - 9, 1, 1);
                // Antennae twitching
                const aw = Math.sin(eng.animTimer / 200) * 2;
                ctx.strokeStyle = '#114411';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(sx - 3, sy - 12); ctx.lineTo(sx - 6 + aw, sy - 22); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx + 3, sy - 12); ctx.lineTo(sx + 6 - aw, sy - 22); ctx.stroke();
                // Mandibles clicking
                const mc = Math.floor(eng.animTimer / 180) % 2;
                ctx.fillStyle = '#FFEE88';
                ctx.fillRect(sx - 3 - mc, sy - 3, 2, 3);
                ctx.fillRect(sx + 1 + mc, sy - 3, 2, 3);
                // Four arms clutching a fizzing drink
                ctx.fillStyle = '#226622';
                ctx.fillRect(sx - 12, sy + 2, 5, 8);
                ctx.fillRect(sx + 7, sy + 2, 5, 8);
                ctx.fillRect(sx - 10, sy + 10, 4, 6);
                ctx.fillRect(sx + 6, sy + 10, 4, 6);
                // Fizzing cocktail on counter
                ctx.fillStyle = '#FFAA33';
                ctx.fillRect(sx - 3, sy + 12, 6, 8);
                // Fizz bubbles
                for (let b = 0; b < 3; b++) {
                    const bp = ((eng.animTimer / 120) + b * 30) % 30;
                    ctx.fillStyle = `rgba(255,255,200,${Math.max(0, 1 - bp / 30)})`;
                    ctx.fillRect(sx - 2 + (b % 2) * 3, sy + 11 - bp, 1, 1);
                }
            }

            // Crystar the crystalline being at bar (mid position)
            {
                const cx = 165, cy = 232;
                // Shimmer: rotate hue gently
                const shimmer = (Math.sin(eng.animTimer / 400) + 1) / 2;
                // Crystal body: angular diamond shape
                ctx.fillStyle = `rgba(${80 + shimmer * 40},${200 + shimmer * 40},${240},0.9)`;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 24);
                ctx.lineTo(cx + 10, cy - 8);
                ctx.lineTo(cx + 8, cy + 18);
                ctx.lineTo(cx - 8, cy + 18);
                ctx.lineTo(cx - 10, cy - 8);
                ctx.closePath(); ctx.fill();
                // Inner facets
                ctx.strokeStyle = `rgba(255,255,255,${0.4 + shimmer * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 18);
                ctx.moveTo(cx - 10, cy - 8); ctx.lineTo(cx + 10, cy - 8);
                ctx.stroke();
                // Inner glow "heart"
                ctx.fillStyle = `rgba(255,255,200,${0.5 + shimmer * 0.4})`;
                ctx.fillRect(cx - 2, cy - 4, 4, 6);
                // Eye glints
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(cx - 4, cy - 12, 2, 2);
                ctx.fillRect(cx + 2, cy - 12, 2, 2);
                // No drink \u2014 Crystar doesn't drink. Crystar radiates.
            }

            // Tables
            // Table 2 already drawn above (with Blorp). Next up: ambiance.

            // Ambiance - neon sign on wall (AGI-style: 2-frame blink)
            const signOn = Math.floor(eng.animTimer / 500) % 2;
            ctx.fillStyle = signOn ? '#FF5555' : '#AA0000';
            ctx.font = '14px "Courier New"';
            ctx.fillText('LIVE MUSIC', 400, 50);
            // Music notes (AGI-style: discrete 2-position steps)
            ctx.fillStyle = signOn ? '#FFFF55' : '#AA5500';
            ctx.font = '16px "Courier New"';
            const notePos = Math.floor(eng.animTimer / 700) % 2;
            ctx.fillText('♪', 380 + notePos * 6, 55);
            ctx.fillText('♫', 530 - notePos * 5, 45);

            // Exit door
            ctx.fillStyle = '#3a2030';
            ctx.fillRect(0, 100, 25, 180);
            ctx.fillStyle = '#664433';
            ctx.fillRect(3, 105, 19, 170);
            ctx.fillStyle = '#CCAA33';
            ctx.fillRect(18, 190, 3, 3);

            // Smoke effect (AGI-style: sparse gray pixels)
            ctx.fillStyle = '#555555';
            for (let py = 0; py < 120; py += 10) {
                for (let px = ((py / 10) % 2) * 10; px < w; px += 20) {
                    ctx.fillRect(px, py, 1, 1);
                }
            }

            // Ceiling fan
            const fanAngle = eng.animTimer / 100;
            ctx.save();
            ctx.translate(350, 25);
            ctx.fillStyle = '#555555';
            ctx.fillRect(-2, -2, 4, 8);
            ctx.rotate(fanAngle);
            ctx.fillStyle = '#444444';
            ctx.fillRect(-25, -3, 50, 6);
            ctx.restore();

            // Dartboard on wall
            ctx.fillStyle = '#553322';
            ctx.beginPath(); ctx.arc(510, 85, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#CC2222';
            ctx.beginPath(); ctx.arc(510, 85, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#EEEECC';
            ctx.beginPath(); ctx.arc(510, 85, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#CC2222';
            ctx.beginPath(); ctx.arc(510, 85, 2, 0, Math.PI * 2); ctx.fill();
            // Dart stuck in wall (missed board)
            ctx.fillStyle = '#888888';
            ctx.fillRect(530, 78, 8, 2);
            ctx.fillStyle = '#CC4444';
            ctx.fillRect(537, 77, 4, 4);

            // Tally marks scratched into bar
            ctx.strokeStyle = 'rgba(200,180,150,0.25)';
            ctx.lineWidth = 1;
            for (let ti = 0; ti < 4; ti++) {
                ctx.beginPath(); ctx.moveTo(35 + ti * 4, 147); ctx.lineTo(35 + ti * 4, 155); ctx.stroke();
            }
            ctx.beginPath(); ctx.moveTo(33, 151); ctx.lineTo(52, 151); ctx.stroke();

            // Alien jukebox in corner
            ctx.fillStyle = '#553355';
            ctx.fillRect(560, 120, 40, 60);
            ctx.fillStyle = '#664466';
            ctx.fillRect(564, 124, 32, 30);
            // Jukebox lights
            const jbGlow = Math.sin(eng.animTimer / 300);
            ctx.fillStyle = `rgba(255,100,100,${0.5 + jbGlow * 0.3})`;
            ctx.fillRect(568, 128, 6, 6);
            ctx.fillStyle = `rgba(100,100,255,${0.5 - jbGlow * 0.3})`;
            ctx.fillRect(578, 128, 6, 6);
            ctx.fillStyle = `rgba(100,255,100,${0.5 + jbGlow * 0.2})`;
            ctx.fillRect(588, 128, 6, 6);

            // Spilled drink on floor
            ctx.fillStyle = 'rgba(50,80,50,0.15)';
            ctx.beginPath(); ctx.ellipse(300, 310, 15, 6, 0.3, 0, Math.PI * 2); ctx.fill();
        },
        hotspots: [
            {
                name: 'Bartender', x: 165, y: 65, w: 60, h: 80,
                description: 'A large, green-skinned alien bartender.',
                look: (e) => e.showMessage('A burly, three-eyed alien bartender of a species you don\'t recognize. He\'s polishing a glass with three hands while keeping all three eyes on the room. Professional.'),
                talk: (e) => {
                    e.startDialog('bartender');
                },
                useItem: (e, itemId) => {
                    if (itemId === 'credits') {
                        const cr = e.getFlag('credits_amount') || 0;
                        if (cr >= 10 && !e.hasItem('drink')) {
                            engine.sound.sell();
                            e.showMessage('You slap 10 buckazoids on the bar. The bartender pours you a shimmering green Keronian Ale. "Here ya go, smoothskin. Don\'t drink it all at once."');
                            e.setFlag('credits_amount', cr - 10);
                            e.items['credits'].name = `Buckazoids (${cr - 10})`;
                            e.items['credits'].description = `A credit chip with ${cr - 10} buckazoids remaining.`;
                            if (cr - 10 <= 0) e.removeFromInventory('credits');
                            e.addToInventory('drink');
                            e.updateInventoryUI();
                        } else if (e.hasItem('drink')) {
                            e.showMessage('"You\'ve already got a drink, smoothskin."');
                        } else {
                            e.showMessage('"You ain\'t got enough for a drink. Come back when you got some real money."');
                        }
                    } else {
                        e.showMessage('"I only accept buckazoids, smoothskin."');
                    }
                }
            },
            {
                name: 'Alien Pilot', x: 430, y: 170, w: 70, h: 80,
                description: 'A weathered alien pilot nursing an empty glass.',
                look: (e) => {
                    if (e.getFlag('pilot_left')) {
                        e.showMessage('The pilot\'s seat is empty. He\'s gone.');
                    } else {
                        e.showMessage('A grizzled alien pilot slumped at the table. He wears a leather flight jacket covered in mission patches. His glass is empty and he looks miserable. Judging by the patches, he\'s been everywhere in the sector.');
                    }
                },
                talk: (e) => {
                    if (e.getFlag('pilot_left')) {
                        e.showMessage('He\'s not here anymore.');
                    } else if (e.getFlag('pilot_has_drink')) {
                        e.startDialog('zorthak', 'after_drink');
                    } else {
                        e.startDialog('zorthak');
                    }
                },
                useItem: (e, itemId) => {
                    if (e.getFlag('pilot_left')) {
                        e.showMessage('He\'s gone.');
                        return;
                    }
                    if (itemId === 'drink') {
                        engine.sound.drink();
                        e.removeFromInventory('drink');
                        e.setFlag('pilot_has_drink');
                        e.showMessage('"For me?! You\'re a saint!" Zorthak grabs the ale and downs half of it in one gulp. His eyes light up. "Alright, alright, I promised info and Zorthak keeps his word..."');
                        // Pilot gives you the nav chip via short cutscene delay
                        const savedPX = engine.playerX, savedPY = engine.playerY;
                        e.playCutscene({
                            duration: 3000,
                            skippable: true,
                            draw: (ctx, w, h, progress) => {
                                miniAnimRedrawRoom(ctx, w, h);
                                // Draw player character at their position
                                drawPlayerBody(ctx, savedPX, savedPY, engine.playerSpriteScale(savedPY), 0);
                                // Pilot drinking animation
                                const pilotX = 430, pilotY = 208;
                                // Arm lifting drink
                                const drinkP = Math.min(progress / 0.4, 1);
                                ctx.fillStyle = '#556688';
                                ctx.fillRect(pilotX + 12, pilotY - 8 - drinkP * 10, 8, 12);
                                // Mug
                                ctx.fillStyle = '#AA8844';
                                ctx.fillRect(pilotX + 10, pilotY - 18 - drinkP * 10, 12, 8);
                                ctx.fillStyle = '#DDAA44';
                                ctx.fillRect(pilotX + 11, pilotY - 17 - drinkP * 10, 10, 5);
                                // Satisfaction stars
                                if (progress > 0.5) {
                                    const sp = (progress - 0.5) / 0.5;
                                    ctx.fillStyle = `rgba(255,255,100,${0.7 * (1 - sp)})`;
                                    ctx.font = `${8 + sp * 4}px "Courier New"`;
                                    ctx.textAlign = 'center';
                                    ctx.fillText('*hic*', pilotX + 15, pilotY - 35 - sp * 15);
                                    ctx.textAlign = 'left';
                                }
                            },
                            onEnd: () => {
                                if (e.getFlag('pilot_left')) return;
                                e.showMessage('"Those Draknoid thugs... I did a cargo run near their flagship last month. Got the coordinates logged before they chased me off. Take this nav chip — it\'ll get you right to \'em." He slides a chip across the table.');
                                e.addToInventory('nav_chip');
                                e.setFlag('pilot_left');
                                e.addScore(20);
                            }
                        });
                    } else {
                        e.showMessage('"That\'s not what I need, friend. I need a DRINK."');
                    }
                }
            },
            {
                name: 'Bottles', x: 40, y: 55, w: 280, h: 42,
                description: 'Colorful bottles line the shelves.',
                look: (e) => e.showMessage('An impressive collection of alien liquors in every color imaginable. You recognize none of them. Some of the bottles appear to be glowing. One seems to be moving.'),
                get: (e) => e.showMessage('The bartender gives you a stern three-eyed glare. Best not to steal from a guy with three arms.'),
                talk: (e) => e.showMessage('You lean in close to the bottles. "Any of you guys know a way off this rock?" The moving one gurgles. You decide it doesn\'t count as a real answer.'),
                use: (e) => e.showMessage('You\'re not reaching behind the bar. The bartender has three arms and almost certainly knows how to use all of them.')
            },
            {
                name: 'Blorp', x: 530, y: 205, w: 60, h: 70,
                description: 'A quivering purple blob with a single enormous eye and four tentacles.',
                look: (e) => { if (!engine.getFlag('looked_blorp')) { engine.setFlag('looked_blorp'); e.addScore(1); } e.showMessage('A purple blob roughly the size of a beach ball squats at the table, clutching a glowing green cocktail with four rubbery tentacles. Its single eye tracks you with weary disinterest. The universal translator on your wrist offers "*gurgle*" as its best guess.'); },
                talk: (e) => e.showMessage('You greet the blob. It extrudes a tentacle, taps its glass, and gurgles what is either "cheers" or "I am going to digest you slowly." You nod politely and back away.'),
                get: (e) => e.showMessage('You do not try to pick up a sentient blob. You are a janitor, not a food critic.'),
                use: (e) => e.showMessage('You awkwardly pat the blob. It quivers. The tentacles retract half an inch. That is the most emotion it has shown all night.')
            },
            {
                name: 'Skritch', x: 252, y: 220, w: 32, h: 58,
                description: 'An insectoid with compound eyes and four clicking arms.',
                look: (e) => { if (!engine.getFlag('looked_skritch')) { engine.setFlag('looked_skritch'); e.addScore(1); } e.showMessage('A wiry green insectoid perched on a barstool, antennae twitching, four arms cradling a fizzing orange cocktail. Its compound eyes refract every light in the room. Somewhere under the chitin, you suspect it is judging your shoes.'); },
                talk: (e) => e.showMessage('"*click-click-skrrrt?*" says Skritch. Your translator offers four possibilities, all containing the word "moist." You smile and pretend you understood.'),
                get: (e) => e.showMessage('You are not touching anything with that many moving mouthparts.'),
                use: (e) => e.showMessage('You mime drinking together. Skritch raises its glass, pours half of it directly into an eye, and chitters appreciatively. Different strokes.')
            },
            {
                name: 'Crystar', x: 153, y: 208, w: 28, h: 68,
                description: 'A silent, faintly humming crystalline being.',
                look: (e) => { if (!engine.getFlag('looked_crystar')) { engine.setFlag('looked_crystar'); e.addScore(1); } e.showMessage('A walking geometry problem. Crystar stands perfectly still at the bar, a six-sided crystal the color of a swimming pool, with two white-hot glints where eyes might be. It has no glass. It does not appear to need one. A soft chime radiates from inside.'); },
                talk: (e) => e.showMessage('You speak to Crystar. A harmonic hum resonates back through your fillings. You think it might be agreeing with you. Or tuning your skeleton. Either way, fine.'),
                get: (e) => e.showMessage('You prod Crystar experimentally. The chime goes very slightly flat, which, in your gut, feels like the start of a cosmic lawsuit. You stop prodding.'),
                use: (e) => e.showMessage('You hold up your wrist communicator near Crystar. It briefly tunes itself to a station that has not existed for two centuries. You switch it off quickly.')
            },
            {
                name: 'Dartboard', x: 492, y: 67, w: 36, h: 36,
                description: 'A dartboard on the wall.',
                look: (e) => { if (!engine.getFlag('looked_dartboard')) { engine.setFlag('looked_dartboard'); e.addScore(2); } e.showMessage('An alien dartboard — it has twelve sections instead of the usual twenty. There\'s a dart embedded in the wall a good two feet from the board. Someone has terrible aim.'); },
                get: (e) => e.showMessage('You yank the dart out of the wall. A chunk of plaster comes with it. You stick it back in. Nope, never happened.'),
                use: (e) => e.showMessage('You mime throwing a dart. Without an actual dart, you just look like you\'re having some kind of episode. The bartender eyes you warily.')
            },
            {
                name: 'Jukebox', x: 558, y: 118, w: 44, h: 65,
                description: 'An alien music machine.',
                look: (e) => e.showMessage('A battered alien jukebox with colored lights that pulse to the music. The song list is in a script you can\'t read. The current track sounds like a cat fighting a synthesizer. In a good way?'),
                get: (e) => e.showMessage('You try to pick up the jukebox. It weighs roughly as much as a small shuttle. Your back protests.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = engine.playerSpriteScale(py);
                    e.playCutscene({
                        duration: 1800,
                        skippable: true,
                        draw: (ctx, w, h, progress) => {
                            miniAnimRedrawRoom(ctx, w, h);
                            // Walk toward jukebox, wind up, smack
                            const jbX = 575;
                            const walkP = Math.min(progress / 0.3, 1);
                            const curX = px + (jbX - 30 - px) * walkP;
                            if (progress < 0.3) {
                                drawPlayerBody(ctx, curX, py, sc, 0);
                            } else if (progress < 0.45) {
                                // Wind up arm
                                const wind = (progress - 0.3) / 0.15;
                                drawPlayerBody(ctx, jbX - 30, py, sc, wind * 0.9);
                            } else if (progress < 0.55) {
                                // SMACK!
                                drawPlayerBody(ctx, jbX - 25, py, sc, 0.3);
                                // Impact star
                                const impP = (progress - 0.45) / 0.1;
                                ctx.fillStyle = `rgba(255,255,100,${0.8 * (1 - impP)})`;
                                ctx.font = `${14 + impP * 6}px "Courier New"`;
                                ctx.textAlign = 'center';
                                ctx.fillText('SMACK!', jbX - 5, py - 18 * sc);
                                ctx.textAlign = 'left';
                                // Jukebox shake
                                const jShake = Math.sin(impP * 30) * 3 * (1 - impP);
                                ctx.fillStyle = 'rgba(255,200,50,0.3)';
                                ctx.fillRect(558 + jShake, 118, 44, 65);
                            } else {
                                // Walk back
                                const retP = (progress - 0.55) / 0.45;
                                const retX = (jbX - 30) + (px - (jbX - 30)) * retP;
                                drawPlayerBody(ctx, retX, py, sc, 0);
                            }
                        },
                        onEnd: () => {
                            engine.playerX = px;
                            engine.playerY = py;
                            e.showMessage('You smack the side of the jukebox. The music skips, warbles, then continues playing the same song. Classic troubleshooting technique.');
                        }
                    });
                },
                talk: (e) => e.showMessage('"Play something from Earth!" you request. The jukebox plays something that sounds like a yak being tuned. Close enough.')
            },
            {
                name: 'Ceiling Fan', x: 310, y: 12, w: 60, h: 22,
                description: 'A slowly spinning ceiling fan.',
                look: (e) => e.showMessage('A creaky ceiling fan wobbles overhead, spreading the smoky air around without actually improving it. One blade is bent. Your maintenance senses tingle — but this isn\'t your jurisdiction.'),
                use: (e) => e.showMessage('You can\'t reach the ceiling fan. Probably for the best — the last time you "fixed" a fan, it launched a blade through a wall.')
            },
            {
                name: 'Exit', x: 0, y: 95, w: 28, h: 190, isExit: true, walkToX: 35,
                description: 'Exit back to the outpost street.',
                onExit: (e) => e.goToRoom('outpost', 95, 310)
            }
        ]
    });

    // ========== ROOM 9: SHOP ==========
    engine.registerRoom({
        id: 'shop',
        hint: 'Buy the Pulsar Ray. Draknoid armor laughs at anything else.',
        name: 'Trading Post',
        description: 'The interior of the trading post. An alien merchant stands behind a counter displaying various goods — weapons, tools, and curiosities from across the galaxy.',
        onEnter: (e) => {
            e.sound.startAmbient('outpost_crowd');
            // Sierra pseudo-3D: floor begins at y=260 behind the counter.
            e.setDepthScaling(268, 378, 0.72, 1.0);
            // AGI-inspired barriers: shop counter
            e.addBarrier(40, 255, 420, 15);    // Counter front edge

            // Foreground layer: counter top draws over player
            e.addForegroundLayer(265, (ctx) => {
                ctx.fillStyle = '#665533';
                ctx.fillRect(48, 255, 405, 3); // Counter front lip
            });

            // Edge transition: left exits to outpost
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('outpost', 305, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Recessed display room keeps the merchandise wall as the focal plane.
            ctx.fillStyle = '#100e08';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#51421c';
            ctx.fillRect(82, 32, 476, 228);
            ditherRect(ctx, 100, 42, 440, 24, '#33280f', '#6e5724', 5);
            ctx.fillStyle = '#292313';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(82, 32); ctx.lineTo(82, 260); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(w, 0); ctx.lineTo(558, 32); ctx.lineTo(558, 260); ctx.lineTo(w, 400);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0b0a06';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(558, 32); ctx.lineTo(82, 32);
            ctx.closePath(); ctx.fill();
            perspectiveFloor(ctx, 260, w, h, '#22201a', '#4a4126');
            // Shop floor: warm spill from the display wall and a runner toward the
            // counter, so the foreground reads as boards rather than empty space.
            ctx.fillStyle = '#2b2721';
            ctx.beginPath();
            ctx.moveTo(96, 260); ctx.lineTo(544, 260); ctx.lineTo(w, 400); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#342e25';
            ctx.beginPath();
            ctx.moveTo(176, 262); ctx.lineTo(464, 262); ctx.lineTo(566, 400); ctx.lineTo(74, 400);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(150,116,48,0.10)';
            ctx.beginPath();
            ctx.moveTo(120, 262); ctx.lineTo(520, 262); ctx.lineTo(596, 328); ctx.lineTo(44, 328);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.20)';
            ctx.fillRect(96, 300, 448, 2);
            ctx.fillRect(56, 350, 528, 3);

            // Counter
            ctx.fillStyle = '#554422';
            ctx.fillRect(50, 200, 400, 12);
            ctx.fillStyle = '#665533';
            ctx.fillRect(40, 210, 420, 50);
            ctx.fillStyle = '#554422';
            ctx.fillRect(45, 215, 410, 40);

            // Display case behind counter
            ctx.fillStyle = '#333328';
            ctx.fillRect(60, 50, 380, 140);
            ctx.strokeStyle = '#555540';
            ctx.strokeRect(60, 50, 380, 140);

            // Items on display
            // Pulsar Ray - detailed weapon
            if (!eng.getFlag('bought_ray')) {
                // Gun body
                ctx.fillStyle = '#888899';
                ctx.fillRect(100, 110, 45, 18);
                // Grip
                ctx.fillStyle = '#666677';
                ctx.fillRect(100, 114, 15, 14);
                ctx.fillStyle = '#555566';
                ctx.fillRect(102, 116, 11, 10);
                // Grip texture lines
                ctx.fillStyle = '#777788';
                ctx.fillRect(103, 118, 9, 1);
                ctx.fillRect(103, 121, 9, 1);
                ctx.fillRect(103, 124, 9, 1);
                // Barrel
                ctx.fillStyle = '#AAAACC';
                ctx.fillRect(145, 114, 22, 8);
                // Barrel tip glow
                ctx.fillStyle = '#CCDDFF';
                ctx.fillRect(165, 115, 4, 6);
                // Trigger
                ctx.fillStyle = '#444455';
                ctx.fillRect(118, 124, 3, 5);
                // Scope
                ctx.fillStyle = '#999AAA';
                ctx.fillRect(125, 107, 18, 5);
                ctx.fillStyle = '#AABBCC';
                ctx.fillRect(127, 108, 4, 3);
                // "MK IV" text
                ctx.fillStyle = '#BBBBDD';
                ctx.font = '5px "Courier New"';
                ctx.fillText('MK IV', 130, 120);
                // Price tag
                ctx.fillStyle = '#FFFF88';
                ctx.font = '9px "Courier New"';
                ctx.fillText('PULSAR RAY', 90, 100);
                // Tag with string
                ctx.fillStyle = '#FFFFAA';
                ctx.fillRect(95, 136, 32, 14);
                ctx.fillStyle = '#AA6622';
                ctx.font = '7px "Courier New"';
                ctx.fillText('30 BUCKS', 96, 146);
                ctx.strokeStyle = '#CCCC88';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(120, 128); ctx.lineTo(111, 136); ctx.stroke();
            }

            // Jet pack - more detail
            ctx.fillStyle = '#777766';
            ctx.fillRect(230, 90, 40, 50);
            // Vent nozzles
            ctx.fillStyle = '#555544';
            ctx.fillRect(233, 140, 10, 14);
            ctx.fillRect(257, 140, 10, 14);
            // Flame effect (decorative)
            ctx.fillStyle = '#CC6622';
            ctx.fillRect(235, 152, 6, 5);
            ctx.fillRect(259, 152, 6, 5);
            ctx.fillStyle = '#FFAA44';
            ctx.fillRect(236, 153, 4, 3);
            ctx.fillRect(260, 153, 4, 3);
            // Control panel
            ctx.fillStyle = '#666655';
            ctx.fillRect(240, 78, 20, 14);
            ctx.fillStyle = '#22CC22';
            ctx.fillRect(244, 82, 4, 4);
            ctx.fillStyle = '#CC2222';
            ctx.fillRect(252, 82, 4, 4);
            // Straps
            ctx.fillStyle = '#554433';
            ctx.fillRect(232, 100, 4, 35);
            ctx.fillRect(264, 100, 4, 35);
            ctx.fillStyle = '#FFFF88';
            ctx.font = '9px "Courier New"';
            ctx.fillText('JET PACK', 228, 76);
            ctx.fillStyle = '#FFFFAA';
            ctx.fillRect(222, 158, 42, 12);
            ctx.fillStyle = '#AA6622';
            ctx.font = '7px "Courier New"';
            ctx.fillText('500 BUCKS', 224, 167);

            // Shield belt - more detail
            ctx.fillStyle = '#886633';
            ctx.fillRect(348, 108, 65, 18);
            // Belt segments
            ctx.fillStyle = '#775522';
            ctx.fillRect(352, 110, 12, 14);
            ctx.fillRect(368, 110, 12, 14);
            ctx.fillRect(384, 110, 12, 14);
            ctx.fillRect(400, 110, 12, 14);
            // Shield generator (center buckle)
            ctx.fillStyle = '#997744';
            ctx.fillRect(372, 103, 20, 10);
            ctx.fillStyle = '#BBAA66';
            ctx.fillRect(376, 105, 12, 6);
            // Energy indicator
            const shieldGlow = Math.sin(eng.animTimer / 500) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(100,200,255,${shieldGlow * 0.6})`;
            ctx.fillRect(379, 106, 6, 4);
            ctx.fillStyle = '#FFFF88';
            ctx.font = '9px "Courier New"';
            ctx.fillText('SHIELD BELT', 342, 100);
            ctx.fillStyle = '#FFFFAA';
            ctx.fillRect(347, 136, 42, 12);
            ctx.fillStyle = '#AA6622';
            ctx.font = '7px "Courier New"';
            ctx.fillText('200 BUCKS', 349, 146);

            // Merchant - tall lanky alien with robe (positioned behind counter)
            // Body / robe
            ctx.fillStyle = '#AA8844';
            ctx.fillRect(378, 130, 40, 72);
            // Robe detail - hem
            ctx.fillStyle = '#997733';
            ctx.fillRect(378, 195, 40, 7);
            // Robe pattern (diamond shapes)
            ctx.fillStyle = '#BBAA55';
            ctx.fillRect(388, 145, 4, 4);
            ctx.fillRect(402, 160, 4, 4);
            ctx.fillRect(388, 175, 4, 4);
            // Robe sash/belt
            ctx.fillStyle = '#BB4422';
            ctx.fillRect(378, 165, 40, 4);
            ctx.fillStyle = '#CC5533';
            ctx.fillRect(405, 163, 8, 8); // sash knot
            // Head
            ctx.fillStyle = '#CC9955';
            ctx.fillRect(384, 92, 30, 38);
            // Head shape - slightly elongated
            ctx.fillStyle = '#CC9955';
            ctx.fillRect(387, 85, 24, 10);
            // Big alien eyes (detailed with iris rings)
            ctx.fillStyle = '#113322';
            ctx.beginPath(); ctx.arc(394, 108, 7, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(409, 108, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#22FF44';
            ctx.beginPath(); ctx.arc(394, 108, 5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(409, 108, 5, 0, Math.PI * 2); ctx.fill();
            // Eye highlight
            ctx.fillStyle = '#88FF88';
            ctx.beginPath(); ctx.arc(392, 106, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(407, 106, 2, 0, Math.PI * 2); ctx.fill();
            // Pupil slits
            ctx.fillStyle = '#001100';
            ctx.fillRect(393, 105, 2, 6);
            ctx.fillRect(408, 105, 2, 6);
            // Alien nostrils (slits)
            ctx.fillStyle = '#AA7733';
            ctx.fillRect(399, 118, 2, 3);
            ctx.fillRect(403, 118, 2, 3);
            // Mouth - thin alien lips with knowing smile
            ctx.fillStyle = '#996633';
            ctx.fillRect(395, 123, 14, 2);
            ctx.fillStyle = '#AA7744';
            ctx.fillRect(408, 122, 2, 1); // smile upturn
            // Merchant hat - elaborate
            ctx.fillStyle = '#773322';
            ctx.fillRect(376, 84, 46, 6);
            ctx.fillRect(382, 72, 34, 14);
            // Hat band
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(382, 80, 34, 3);
            // Hat jewel
            ctx.fillStyle = '#FF4444';
            ctx.fillRect(397, 75, 4, 4);
            ctx.fillStyle = '#FF8888';
            ctx.fillRect(398, 76, 2, 2);
            // Ears (long pointed alien ears)
            ctx.fillStyle = '#CC9955';
            ctx.fillRect(380, 98, 4, 20);
            ctx.fillRect(414, 98, 4, 20);
            ctx.fillStyle = '#BB8844';
            ctx.fillRect(381, 100, 2, 15);
            ctx.fillRect(415, 100, 2, 15);
            // Necklace / pendant
            ctx.fillStyle = '#DDCC44';
            ctx.fillRect(395, 130, 8, 2);
            ctx.fillStyle = '#FFDD55';
            ctx.fillRect(398, 131, 3, 4);
            // Arms - long & thin
            ctx.fillStyle = '#AA8844';
            ctx.fillRect(368, 140, 10, 55);
            ctx.fillRect(418, 140, 10, 55);
            // Sleeve cuffs
            ctx.fillStyle = '#CCAA44';
            ctx.fillRect(368, 140, 10, 3);
            ctx.fillRect(418, 140, 10, 3);
            // Hands on counter - with rings
            ctx.fillStyle = '#CC9955';
            ctx.fillRect(366, 194, 14, 8);
            ctx.fillRect(416, 194, 14, 8);
            // Finger detail
            ctx.fillStyle = '#BB8844';
            ctx.fillRect(368, 200, 3, 2);
            ctx.fillRect(372, 200, 3, 2);
            ctx.fillRect(418, 200, 3, 2);
            ctx.fillRect(422, 200, 3, 2);
            // Rings
            ctx.fillStyle = '#FFDD44';
            ctx.fillRect(370, 198, 2, 2);
            ctx.fillRect(424, 198, 2, 2);

            // Sign on wall
            ctx.fillStyle = '#554433';
            ctx.fillRect(480, 45, 130, 35);
            ctx.fillStyle = '#DDCC88';
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillText('TINY\'S TRADING', 486, 62);
            ctx.font = '9px "Courier New"';
            ctx.fillText('POST', 527, 74);

            // Misc items on shelves - more detail
            ctx.fillStyle = '#666655';
            ctx.fillRect(505, 135, 15, 20);
            ctx.fillRect(530, 130, 20, 25);
            ctx.fillStyle = '#445544';
            ctx.fillRect(555, 140, 12, 15);
            // Helmet on shelf
            ctx.fillStyle = '#778877';
            ctx.beginPath(); ctx.arc(512, 134, 8, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#446688';
            ctx.fillRect(507, 134, 12, 3); // visor
            // Box with alien text
            ctx.fillStyle = '#887766';
            ctx.fillRect(535, 128, 16, 4);
            ctx.fillStyle = '#554433';
            ctx.font = '3px "Courier New"';
            ctx.fillText('PARTS', 536, 131);
            // Small tool
            ctx.fillStyle = '#AAAAAA';
            ctx.fillRect(557, 142, 8, 2);
            ctx.fillStyle = '#888888';
            ctx.fillRect(556, 144, 4, 8);

            // Shelving bracket details
            ctx.fillStyle = '#443322';
            ctx.fillRect(500, 155, 3, 10);
            ctx.fillRect(550, 155, 3, 10);

            // Wall-mounted alien weapons (decoration)
            ctx.fillStyle = '#555566';
            ctx.fillRect(25, 70, 50, 8);
            ctx.fillStyle = '#666677';
            ctx.fillRect(30, 72, 12, 4);
            // Mounting brackets
            ctx.fillStyle = '#443322';
            ctx.fillRect(35, 65, 3, 6);
            ctx.fillRect(60, 65, 3, 6);

            // "NO REFUNDS" sign
            ctx.fillStyle = '#CC4444';
            ctx.font = '7px "Courier New"';
            ctx.fillText('NO REFUNDS', 60, 240);

            // Dusty footprints on floor
            ctx.fillStyle = 'rgba(50,45,30,0.1)';
            ctx.fillRect(200, 310, 6, 8);
            ctx.fillRect(220, 315, 6, 8);
            ctx.fillRect(250, 310, 6, 8);

            // Cash register
            ctx.fillStyle = '#444444';
            ctx.fillRect(50, 215, 30, 20);
            ctx.fillStyle = '#555555';
            ctx.fillRect(52, 217, 26, 12);
            ctx.fillStyle = '#22CC22';
            ctx.font = '6px "Courier New"';
            ctx.fillText('0.00', 55, 225);

            // Exit door
            ctx.fillStyle = '#3a3020';
            ctx.fillRect(0, 100, 25, 185);
            ctx.fillStyle = '#554422';
            ctx.fillRect(3, 105, 19, 175);
            ctx.fillStyle = '#CCAA33';
            ctx.fillRect(18, 192, 3, 3);
        },
        hotspots: [
            {
                name: 'Merchant', x: 365, y: 75, w: 70, h: 140,
                description: 'The alien shopkeeper called Tiny (ironically).',
                look: (e) => e.showMessage('A tall, lean alien with huge green eyes and a merchant\'s hat. Despite the name "Tiny" on the sign, he\'s actually quite imposing. He watches you with those huge, unblinking eyes.'),
                talk: (e) => {
                    e.startDialog('tiny');
                },
                useItem: (e, itemId) => {
                    if (itemId === 'crystal') {
                        engine.sound.sell();
                        e.showMessage('"A XENON CRYSTAL! These are incredibly rare! I\'ll give you... 50 buckazoids for it. Deal?" The merchant\'s eyes go even wider than usual. He hands you a credit chip.');
                        e.removeFromInventory('crystal');
                        e.addToInventory('credits');
                        e.setFlag('credits_amount', 50);
                        e.items['credits'].name = 'Buckazoids (50)';
                        e.items['credits'].description = 'A credit chip with 50 buckazoids.';
                        e.addScore(10);
                        e.updateInventoryUI();
                    } else if (itemId === 'credits') {
                        e.showMessage('"Looking to buy? Check out my wares! Click on what you want."');
                    } else {
                        e.showMessage('"I don\'t deal in that sort of thing, friend."');
                    }
                }
            },
            {
                name: 'Pulsar Ray', x: 85, y: 90, w: 90, h: 65,
                description: 'A compact Pulsar Ray energy weapon. 30 buckazoids.',
                look: (e) => {
                    if (e.getFlag('bought_ray')) {
                        e.showMessage('The display spot where the Pulsar Ray was is now empty.');
                    } else {
                        e.showMessage('A Mark IV Pulsar Ray — compact energy sidearm. Perfect for self-defense. The price tag reads 30 buckazoids. Not cheap, but it could save your life.');
                    }
                },
                get: (e) => {
                    if (e.getFlag('bought_ray')) {
                        e.showMessage('You already bought it.');
                    } else {
                        e.showMessage('"Hey, you gotta PAY for that!" the merchant growls. "30 buckazoids."');
                    }
                },
                use: (e) => {
                    const cr = e.getFlag('credits_amount') || 0;
                    if (e.getFlag('bought_ray')) {
                        e.showMessage('Already purchased.');
                    } else if (cr >= 30) {
                        engine.sound.sell();
                        e.showMessage('"30 buckazoids — SOLD!" The merchant wraps up the Pulsar Ray. "Fine weapon. Point the glowy end away from yourself." He winks one of his huge eyes.');
                        e.setFlag('bought_ray');
                        e.setFlag('credits_amount', cr - 30);
                        e.addToInventory('pulsar_ray');
                        e.items['credits'].name = `Buckazoids (${cr - 30})`;
                        e.items['credits'].description = `A credit chip with ${cr - 30} buckazoids remaining.`;
                        if (cr - 30 <= 0) e.removeFromInventory('credits');
                        e.addScore(10);
                        e.updateInventoryUI();
                    } else if (e.hasItem('credits')) {
                        e.showMessage('"You don\'t have enough buckazoids for that. It\'s 30. Come back when you\'ve got the cash."');
                    } else {
                        e.showMessage('"That costs 30 buckazoids. You got any money?"');
                    }
                },
                useItem: (e, itemId) => {
                    if (itemId === 'credits') {
                        const cr = e.getFlag('credits_amount') || 0;
                        if (e.getFlag('bought_ray')) {
                            e.showMessage('You already bought the Pulsar Ray.');
                        } else if (cr >= 30) {
                            engine.sound.sell();
                            e.showMessage('"SOLD! One Mark IV Pulsar Ray, coming right up!" Tiny carefully hands you the weapon. "Remember: safety first. Point away from face."');
                            e.setFlag('bought_ray');
                            e.setFlag('credits_amount', cr - 30);
                            e.addToInventory('pulsar_ray');
                            e.items['credits'].name = `Buckazoids (${cr - 30})`;
                            e.items['credits'].description = `A credit chip with ${cr - 30} buckazoids remaining.`;
                            if (cr - 30 <= 0) e.removeFromInventory('credits');
                            e.addScore(10);
                            e.updateInventoryUI();
                        } else {
                            e.showMessage('"Not enough buckazoids, friend. It\'s 30."');
                        }
                    }
                }
            },
            {
                name: 'Jet Pack', x: 218, y: 72, w: 65, h: 100,
                description: 'A jet pack. Way too expensive.',
                look: (e) => e.showMessage('A ZephyrTech personal jet pack. 500 buckazoids?! That\'s way beyond your salary as a sanitation engineer. You\'d have to mop floors for years to afford that.'),
                get: (e) => e.showMessage('"That\'s 500 buckazoids!" the merchant says firmly. You couldn\'t afford it in a lifetime of janitor wages.'),
                use: (e) => e.showMessage('Far too expensive. 500 buckazoids is more than you\'ve ever seen.')
            },
            {
                name: 'Shield Belt', x: 335, y: 92, w: 78, h: 62,
                description: 'A personal shield belt. Very pricey.',
                look: (e) => e.showMessage('A personal deflector shield belt. 200 buckazoids. Another item firmly in the "not on a janitor\'s salary" category.'),
                get: (e) => e.showMessage('"That\'s 200 buckazoids!" Tiny practically leaps across the counter. You weren\'t going to steal it. Well, you were thinking about it.'),
                use: (e) => e.showMessage('200 buckazoids? Maybe if you found a few more crystals...'),
                talk: (e) => e.showMessage('You whisper to the shield belt: "Someday, baby. Someday." Tiny narrows his huge eyes suspiciously.')
            },
            {
                name: 'No Refunds Sign', x: 50, y: 230, w: 85, h: 14,
                description: 'A sign on the counter.',
                look: (e) => { if (!engine.getFlag('looked_norefunds')) { engine.setFlag('looked_norefunds'); e.addScore(3); } e.showMessage('"NO REFUNDS • NO RETURNS • NO COMPLAINING • NO EXCEPTIONS • NO KIDDING." The sign has been updated multiple times with increasingly aggressive additions.'); },
                get: (e) => e.showMessage('Tiny\'s eyes track your hand. "That sign stays WHERE IT IS." He\'s had people try before, apparently.'),
                talk: (e) => e.showMessage('"What about exchanges—" you begin. "READ THE SIGN," Tiny snarls. You read it again. Fair enough.')
            },
            {
                name: 'Exit', x: 0, y: 95, w: 28, h: 195, isExit: true, walkToX: 35,
                description: 'Exit back to the outpost.',
                onExit: (e) => e.goToRoom('outpost', 305, 310)
            }
        ]
    });

    /** Single place that puts out the engine-room conduit fire and scores it. */
});
