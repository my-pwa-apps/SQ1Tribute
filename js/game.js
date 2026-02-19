// ============================================================
// STAR SWEEPER - GAME CONTENT
// All rooms, items, puzzles, and artwork
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const engine = new GameEngine();

    // ========== ITEMS ==========
    [
        { id: 'keycard', name: 'Keycard', description: 'A Level 3 security keycard. The label reads "DR. CHEN - XENOPHYSICS".' },
        { id: 'cartridge', name: 'Data Cartridge', description: 'A data cartridge labeled "QUANTUM DRIVE v3.1 - TECHNICAL SPECIFICATIONS". Could be important.' },
        { id: 'survival_kit', name: 'Survival Kit', description: 'A standard-issue survival kit: water purification tablets, nutrient bars, and a signal mirror.' },
        { id: 'crystal', name: 'Xenon Crystal', description: 'A fist-sized crystal that pulses with a mesmerizing blue-green inner light. It looks very valuable.' },
        { id: 'credits', name: 'Buckazoids', description: 'A credit chip. The standard galactic currency.' },
        { id: 'pulsar_ray', name: 'Pulsar Ray', description: 'A compact Mark IV energy sidearm. Small but packs a punch.' },
        { id: 'drink', name: 'Keronian Ale', description: 'A glass of potent alien ale. The liquid shimmers an unsettling shade of green.' },
        { id: 'nav_chip', name: 'Nav Chip', description: 'A navigation chip containing hyperspace coordinates to the Draknoid flagship location.' },
        { id: 'mop_handle', name: 'Mop Handle', description: 'A sturdy titanium alloy mop handle. Not much of a weapon, but great for prying things open.' },
    ].forEach(item => engine.registerItem(item));

    // ========== AGS-INSPIRED DIALOG TREES ==========

    // Bartender dialog — the cantina bartender has info and sells drinks
    engine.registerDialog({
        id: 'bartender',
        startTopic: 'greeting',
        topics: [
            {
                id: 'greeting',
                text: '"Welcome to the cantina, smoothskin. What can old Grix do for ya?"',
                options: [
                    {
                        text: 'What is this place?',
                        response: '"This here is the finest — and only — cantina on Kerona. We got drinks, music, and just the right amount of danger. Been running this joint for 30 cycles now."',
                        once: true
                    },
                    {
                        text: 'I\'d like a Keronian Ale. (10 buckazoids)',
                        response: '"Sure thing, smoothskin." The bartender pours you a shimmering green Keronian Ale and slides it across the bar. "Don\'t drink it all at once."',
                        action: (eng) => {
                            const cr = eng.getFlag('credits_amount') || 0;
                            eng.sound.sell();
                            eng.setFlag('credits_amount', cr - 10);
                            eng.items['credits'].name = 'Buckazoids (' + (cr - 10) + ')';
                            eng.items['credits'].description = 'A credit chip with ' + (cr - 10) + ' buckazoids remaining.';
                            if (cr - 10 <= 0) eng.removeFromInventory('credits');
                            eng.addToInventory('drink');
                            eng.updateInventoryUI();
                        },
                        condition: (eng) => eng.hasItem('credits') && !eng.hasItem('drink') && (eng.getFlag('credits_amount') || 0) >= 10
                    },
                    {
                        text: 'I\'d like a Keronian Ale.',
                        response: '"Can\'t pour what you can\'t pay for. 10 buckazoids, smoothskin."',
                        condition: (eng) => eng.hasItem('credits') && !eng.hasItem('drink') && (eng.getFlag('credits_amount') || 0) < 10
                    },
                    {
                        text: 'I\'d like another ale.',
                        response: '"You already got a drink. Don\'t be greedy, smoothskin."',
                        condition: (eng) => eng.hasItem('drink')
                    },
                    {
                        text: 'Know anything about the Draknoids?',
                        response: '"Draknoids? Bad news, those ones. Mean, scaly, and they don\'t tip. They got a flagship somewhere in the Earnon sector. Talk to that pilot over there — Zorthak. He knows more than he lets on."',
                        once: true
                    },
                    {
                        text: 'Who\'s that pilot over there?',
                        response: '"That\'s Zorthak. Used to be the best navigator in the sector before the drink got him. Literally. He crashed a freighter into a bar. Buy him an ale and he might share some useful intel."',
                        once: true,
                        condition: (eng) => !eng.getFlag('pilot_left')
                    },
                    {
                        text: 'Seen anything unusual lately?',
                        response: '"Unusual? Ha! Everything\'s unusual out here. Though I did see some Draknoid scouts sniffing around the landing pad last week. Buyer beware if you\'re planning to fly anywhere."',
                        once: true
                    },
                    {
                        text: 'Never mind. Goodbye.',
                        response: '"Keep your nose clean, smoothskin."',
                        endDialog: true
                    }
                ]
            }
        ]
    });

    // Zorthak the pilot — gives info and eventually the nav chip
    engine.registerDialog({
        id: 'zorthak',
        startTopic: 'greeting',
        topics: [
            {
                id: 'greeting',
                text: '"*hic* Name\'s Zorthak. Best pilot... well, FORMER best pilot in the sector."',
                options: [
                    {
                        text: 'What happened to your license?',
                        response: '"Crashed a cargo hauler into this very cantina three cycles ago. In my defense, the autopilot was broken AND I was celebrating my birthday. Grix rebuilt the place, but the Pilot\'s Guild wasn\'t as forgiving."',
                        once: true
                    },
                    {
                        text: 'Tell me about the Draknoids.',
                        response: '"The Draknoids... *hic*... they\'re up to something big. Got a flagship hidden in the Earnon sector. But I ain\'t saying more without a drink in my hand. A Keronian Ale would loosen these lips real nice."',
                        once: true
                    },
                    {
                        text: 'Can I buy you a drink?',
                        response: '"Now you\'re speaking my language! A Keronian Ale — tell Grix to put it on your tab."',
                        condition: (eng) => !eng.hasItem('drink') && !eng.getFlag('pilot_has_drink')
                    },
                    {
                        text: 'Here, have this ale.',
                        response: '"For ME?! You\'re a saint among smoothskins!"',
                        condition: (eng) => eng.hasItem('drink') && !eng.getFlag('pilot_has_drink'),
                        action: (eng) => {
                            eng.sound.drink();
                            eng.removeFromInventory('drink');
                            eng.setFlag('pilot_has_drink');
                            eng.updateInventoryUI();
                        },
                        nextTopic: 'after_drink'
                    },
                    {
                        text: 'Know any way off this rock?',
                        response: '"There\'s a cargo shuttle on the landing pad outside. Spaceworthy enough, but you\'d need nav coordinates. *hic* And a death wish, depending on where you\'re headed."',
                        once: true
                    },
                    {
                        text: 'I need to go. See you around.',
                        response: '"Yeah, yeah... I\'ll be right here. Not like I got anywhere to go."',
                        endDialog: true
                    }
                ]
            },
            {
                id: 'after_drink',
                text: 'Zorthak grabs the ale and downs half in one gulp. His eyes light up. "Alright, alright, I PROMISED info and Zorthak keeps his word..."',
                options: [
                    {
                        text: 'Tell me everything about the Draknoids.',
                        response: '"Those Draknoid thugs... I did a cargo run near their flagship last month. Got the coordinates logged before they chased me off. Here — take this nav chip. It\'ll get you right to \'em." He slides a chip across the table.',
                        action: (eng) => {
                            eng.addToInventory('nav_chip');
                            eng.setFlag('pilot_left');
                            eng.addScore(20);
                            eng.updateInventoryUI();
                        },
                        endDialog: true
                    },
                    {
                        text: 'What else do you know?',
                        response: '"I know that this ale is DIVINE. Oh, you mean useful stuff? The Draknoids guard their ship with some kind of energy barrier. You\'ll need serious firepower to get past their guards. Check Tiny\'s shop — he sells hardware."',
                        once: true
                    }
                ]
            }
        ]
    });

    // Tiny the merchant — trading post shopkeeper
    engine.registerDialog({
        id: 'tiny',
        startTopic: 'greeting',
        topics: [
            {
                id: 'greeting',
                text: '"Welcome, welcome! Tiny\'s Trading Post — where every deal is a steal! ...For me, mostly."',
                options: [
                    {
                        text: 'Tell me about the Pulsar Ray.',
                        response: '"Ah, the Mark IV Pulsar Ray! Compact, reliable, and packs a punch. Only 30 buckazoids. Perfect for, uh, \'personal protection\'. Every spacefarer should have one."',
                        once: true,
                        condition: (eng) => !eng.getFlag('bought_ray')
                    },
                    {
                        text: 'What about the jet pack?',
                        response: '"ZephyrTech personal propulsion unit! Only 500 buckazoids. A bargain at twice the price!" His huge eyes blink. "No haggling."',
                        once: true
                    },
                    {
                        text: 'That shield belt looks nice.',
                        response: '"Personal deflector shield — top of the line! 200 buckazoids. I\'d demonstrate but the last customer who tried it fried my display case. Insurance doesn\'t cover that."',
                        once: true
                    },
                    {
                        text: 'Got anything to sell or trade?',
                        response: '"I buy crystals, rare minerals, alien artifacts, data cores — anything valuable. If you got something interesting, show it to me! I pay fair prices... mostly."',
                        once: true
                    },
                    {
                        text: 'What\'s the deal with the refund policy?',
                        response: '"NO refunds. NO returns. NO complaints. Last guy who complained got his money back — in the form of a one-way ticket to the Keronian desert. Read the sign." He points emphatically.',
                        once: true
                    },
                    {
                        text: 'Just browsing. Goodbye.',
                        response: '"Come back when your wallet is ready! Tiny\'s always open."',
                        endDialog: true
                    }
                ]
            }
        ]
    });

    // ========== INTRO CUTSCENE: WAKING UP + ATTACK ==========
    engine.onGameStart = () => {
        let introPhase = 0;
        let phaseStartTime = 0;

        // === Narration box system ===
        // phaseT pauses while a Sierra dialog box is visible, so animations
        // freeze behind the box and one-shot effects don't fire during reads.
        let narrationBox = null;          // { lines, onDismiss } or null
        const narrationSeen = new Set();  // ids of already-shown narrations
        const effectsFired = new Set();   // ids of one-shot sound/shake effects
        let pauseAccum = 0;               // total ms spent paused for narration boxes
        let pauseStart = 0;               // elapsed when current box appeared

        // Phase-local time — freezes while a narration box is open
        function phaseT(elapsed) {
            const activePause = narrationBox ? (elapsed - pauseStart) : 0;
            return elapsed - phaseStartTime - pauseAccum - activePause;
        }

        // Show a one-shot Sierra narration box (id prevents re-showing)
        function showNarration(id, lines, elapsed, onDismiss) {
            if (narrationSeen.has(id)) return;
            narrationSeen.add(id);
            narrationBox = { lines, onDismiss: onDismiss || null };
            pauseStart = elapsed;
        }

        // Fire a one-shot effect (sound, shake, etc.)
        function fireOnce(id, fn) {
            if (effectsFired.has(id)) return;
            effectsFired.add(id);
            fn();
        }

        // Advance to next phase, resetting local timers
        function nextPhase(elapsed) {
            introPhase++;
            phaseStartTime = elapsed;
            pauseAccum = 0;
            effectsFired.clear();
        }

        function endIntro() {
            engine.screenShake = 0;
            engine.cutscene = null;
            engine.playerVisible = true;
            engine.goToRoom('broom_closet', 320, 310);
        }

        // Draw the real broom closet room
        function drawRoom(ctx, w, h, alpha) {
            if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
            const room = engine.rooms['broom_closet'];
            if (room && room.draw) room.draw(ctx, w, h, engine);
            ctx.globalAlpha = 1;
        }

        // Draw the current Sierra-style dialog box (if any)
        function drawSierraBox(ctx, w, h) {
            if (!narrationBox) return;
            // Reset transform so the box is never affected by screen shake
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const lines = narrationBox.lines;
            const lh = 16;
            const padX = 16, padY = 10;
            const boxH = lines.length * lh + padY * 2 + 14;
            const boxW = Math.min(w - 40, 560);
            const boxX = Math.round((w - boxW) / 2);
            const boxY = h - boxH - 12;
            // Drop shadow
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(boxX + 4, boxY + 4, boxW, boxH);
            // Background
            ctx.fillStyle = '#000066';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            // Outer white border
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(boxX, boxY, boxW, 2);
            ctx.fillRect(boxX, boxY + boxH - 2, boxW, 2);
            ctx.fillRect(boxX, boxY, 2, boxH);
            ctx.fillRect(boxX + boxW - 2, boxY, 2, boxH);
            // Inner accent border
            ctx.fillStyle = '#6666CC';
            ctx.fillRect(boxX + 3, boxY + 3, boxW - 6, 1);
            ctx.fillRect(boxX + 3, boxY + boxH - 4, boxW - 6, 1);
            ctx.fillRect(boxX + 3, boxY + 3, 1, boxH - 6);
            ctx.fillRect(boxX + boxW - 4, boxY + 3, 1, boxH - 6);
            // Text lines
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '11px "Courier New"';
            ctx.textAlign = 'center';
            lines.forEach((line, i) => {
                ctx.fillText(line, w / 2, boxY + padY + 11 + i * lh);
            });
            // Blinking continue indicator
            const blink = Math.floor(Date.now() / 500) % 2;
            if (blink) {
                ctx.fillStyle = '#8888CC';
                ctx.font = '8px "Courier New"';
                ctx.fillText('\u25bc', w / 2, boxY + boxH - 4);
            }
            ctx.textAlign = 'left';
            ctx.restore();
        }

        engine.playCutscene({
            duration: 999999,
            skippable: false,
            onAdvance: () => {
                const elapsed = engine.cutscene ? engine.cutscene.elapsed : 0;
                if (narrationBox) {
                    // Dismiss box: accumulate its pause time then fire callback
                    pauseAccum += elapsed - pauseStart;
                    const cb = narrationBox.onDismiss;
                    narrationBox = null;
                    if (cb) cb(elapsed);
                    return;
                }
                // Click with no box during action phases = skip to end
                if (introPhase >= 3) endIntro();
            },
            draw: (ctx, w, h, progress, elapsed) => {
                const t = phaseT(elapsed);
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, w, h);

                // ===== PHASE 0: Ship status terminal =====
                if (introPhase === 0) {
                    const fade = Math.min(t / 1500, 1);
                    ctx.font = '12px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(85,255,85,${fade * 0.8})`;
                    ctx.fillText('ISS CONSTELLATION', w / 2, 70);
                    ctx.fillText('DEEP SPACE SURVEY VESSEL', w / 2, 88);
                    ctx.font = '10px "Courier New"';
                    ctx.fillStyle = `rgba(85,255,85,${fade * 0.6})`;
                    ctx.fillText('CREW: 147  |  MISSION DAY: 2,847', w / 2, 120);
                    ctx.fillText('SECTOR: GAMMA QUADRANT, UNCHARTED ZONE', w / 2, 140);
                    if (t > 1800) {
                        const f2 = Math.min((t - 1800) / 1200, 1);
                        ctx.fillStyle = `rgba(170,170,170,${f2 * 0.7})`;
                        ctx.fillText('SHIP STATUS: ALL SYSTEMS NOMINAL', w / 2, 180);
                        ctx.fillText('TIME: 03:47 SHIP STANDARD', w / 2, 200);
                    }
                    if (t > 3200) {
                        const f3 = Math.min((t - 3200) / 800, 1);
                        ctx.fillStyle = `rgba(170,170,170,${f3 * 0.6})`;
                        ctx.fillText('LOCATION: SUPPLY CLOSET J-6', w / 2, 240);
                    }
                    ctx.textAlign = 'left';
                    if (t > 4200) showNarration('p0_end', [
                        'Another quiet night on the Constellation...',
                        'Or so you thought.'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 1: Broom closet, sleeping =====
                else if (introPhase === 1) {
                    const roomFade = Math.min(t / 2500, 0.45);
                    drawRoom(ctx, w, h, roomFade);
                    const breathe = Math.sin(elapsed / 400) * 1.5;
                    ctx.fillStyle = '#4444DD'; ctx.fillRect(272, 318 + breathe, 46, 14);
                    ctx.fillStyle = '#FFCC88'; ctx.fillRect(260, 314 + breathe, 14, 14);
                    ctx.fillStyle = '#BB7733'; ctx.fillRect(260, 312 + breathe, 14, 5);
                    ctx.fillStyle = '#2828AA'; ctx.fillRect(316, 320 + breathe, 24, 10);
                    ctx.fillStyle = '#222222'; ctx.fillRect(338, 322 + breathe, 8, 8);
                    const zzz = Math.floor(elapsed / 700) % 3;
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.font = '12px "Courier New"';
                    ctx.fillText('z', 252, 304 - zzz * 4);
                    if (zzz > 0) ctx.fillText('z', 244, 292);
                    if (zzz > 1) ctx.fillText('z', 237, 280);
                    if (t > 2000) showNarration('p1_sleep', [
                        'You are sound asleep in your favorite hiding spot -',
                        'the supply closet on deck 6. Best napping spot on the ship.'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 2: Character wakes up =====
                else if (introPhase === 2) {
                    const wakeProg = Math.min(t / 2200, 1);
                    drawRoom(ctx, w, h, 0.45 + wakeProg * 0.35);
                    const standProg = Math.min(wakeProg * 1.5, 1);
                    const px = 300, baseY = 310;
                    if (standProg < 0.4) {
                        const breathe = Math.sin(elapsed / 400) * 1;
                        ctx.fillStyle = '#4444DD'; ctx.fillRect(272, 318 + breathe, 46, 14);
                        ctx.fillStyle = '#FFCC88'; ctx.fillRect(260, 314 + breathe, 14, 14);
                        ctx.fillStyle = '#BB7733'; ctx.fillRect(260, 312 + breathe, 14, 5);
                        ctx.fillStyle = '#2828AA'; ctx.fillRect(316, 320 + breathe, 24, 10);
                        ctx.fillStyle = '#222222'; ctx.fillRect(338, 322 + breathe, 8, 8);
                        if (standProg > 0.2) {
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(262, 319 + breathe, 4, 2);
                            ctx.fillRect(268, 319 + breathe, 4, 2);
                        }
                    } else if (standProg < 0.7) {
                        const sitP = (standProg - 0.4) / 0.3;
                        ctx.fillStyle = '#4444DD'; ctx.fillRect(285, 310 - sitP * 5, 18, 20);
                        ctx.fillStyle = '#FFCC88'; ctx.fillRect(288, 298 - sitP * 8, 12, 12);
                        ctx.fillStyle = '#BB7733'; ctx.fillRect(288, 296 - sitP * 8, 12, 5);
                        ctx.fillStyle = '#2828AA'; ctx.fillRect(285, 328, 12, 8);
                        ctx.fillRect(297, 326, 12, 8);
                    } else {
                        drawPlayerBody(ctx, px, baseY, 1.85, wakeProg > 0.85 ? 0 : 0.5);
                    }
                    if (t > 600) showNarration('p2_yawn', [
                        '*yaaawn*... Huh? What time is it...'
                    ], elapsed, null);
                    if (t > 2200) showNarration('p2_off', [
                        'You stretch and blink at the dim closet light.',
                        'Something feels... off.'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 3: Warning alert =====
                else if (introPhase === 3) {
                    if (!engine.getFlag('alarm_active')) engine.setFlag('alarm_active');
                    drawRoom(ctx, w, h, 0.8);
                    drawPlayerBody(ctx, 300, 310, 1.85, 0);
                    const warn = Math.floor(elapsed / 250) % 2;
                    ctx.fillStyle = warn ? '#FF5555' : '#AA0000';
                    ctx.font = '14px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillText('!! WARNING - PROXIMITY ALERT !!', w / 2, 50);
                    ctx.fillStyle = '#FFFF55';
                    ctx.font = '10px "Courier New"';
                    ctx.fillText('UNIDENTIFIED VESSEL DETECTED', w / 2, 70);
                    ctx.fillText('CLASSIFICATION: HOSTILE', w / 2, 85);
                    ctx.textAlign = 'left';
                    if (t > 100) fireOnce('p3_alarm1', () => engine.sound.alarm());
                    if (t > 1000) fireOnce('p3_alarm2', () => engine.sound.alarm());
                    if (t > 1800) showNarration('p3_react', [
                        'What the--?!'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 4: ATTACK! =====
                else if (introPhase === 4) {
                    if (t < 50) fireOnce('p4_boom1', () => { engine.sound.explosion(); engine.shake(14); });
                    if (t > 1400) fireOnce('p4_boom2', () => { engine.sound.explosion(); engine.shake(10); });
                    const flash1 = t < 400 ? (1 - t / 400) : 0;
                    const flash2 = (t > 1400 && t < 1800) ? (1 - (t - 1400) / 400) : 0;
                    const totalFlash = Math.max(flash1, flash2);
                    drawRoom(ctx, w, h, 0.8);
                    if (totalFlash > 0) {
                        ctx.fillStyle = `rgba(255,50,0,${totalFlash * 0.5})`;
                        ctx.fillRect(0, 0, w, h);
                    }
                    alarmGlow(ctx, w, h, engine);
                    const stumble = Math.sin(elapsed / 120) * 10;
                    const stumbleY = Math.sin(elapsed / 90) * 3;
                    drawPlayerBody(ctx, 300 + stumble, 310 + stumbleY, 1.85, Math.sin(elapsed / 200) * 0.5 + 0.5);
                    for (let i = 0; i < 8; i++) {
                        const sx = 80 + ((elapsed * (i + 1) * 7) % 480);
                        const sy = 20 + ((elapsed * (i + 2) * 3) % 220);
                        const sparkLife = (elapsed + i * 200) % 700 / 700;
                        if (sparkLife < 0.5) {
                            ctx.fillStyle = `rgba(255,200,50,${0.9 - sparkLife * 1.5})`;
                            ctx.fillRect(sx, sy, 2, 2);
                        }
                    }
                    if (t > 800) fireOnce('p4_alarm1', () => engine.sound.alarm());
                    if (t > 600) showNarration('p4_shudder', [
                        '** BOOM!! **',
                        'The ship shudders violently under heavy fire!'
                    ], elapsed, null);
                    if (t > 1600) showNarration('p4_sparks', [
                        'Sparks rain down. The hull groans.'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 5: Emergency =====
                else if (introPhase === 5) {
                    drawRoom(ctx, w, h, 0.8);
                    alarmGlow(ctx, w, h, engine);
                    drawPlayerBody(ctx, 300, 310, 1.85, 0);
                    ctx.fillStyle = '#FF5555';
                    ctx.font = '13px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillText('!! EMERGENCY - ALL HANDS !!', w / 2, 40);
                    ctx.fillStyle = '#FFFF55';
                    ctx.font = '10px "Courier New"';
                    ctx.fillText('HULL BREACH ON DECKS 3-5', w / 2, 60);
                    ctx.fillText('LIFE SUPPORT SYSTEMS FAILING', w / 2, 75);
                    ctx.fillText('EVACUATION PROTOCOL INITIATED', w / 2, 90);
                    ctx.textAlign = 'left';
                    if (t > 200) fireOnce('p5_alarm1', () => engine.sound.alarm());
                    if (t > 1500) fireOnce('p5_alarm2', () => engine.sound.alarm());
                    if (t > 600) showNarration('p5_getout', [
                        'You need to get out of here. NOW.'
                    ], elapsed, (e) => nextPhase(e));
                    drawSierraBox(ctx, w, h);
                }

                // ===== PHASE 6: Fade to black, then start =====
                else if (introPhase === 6) {
                    drawRoom(ctx, w, h, 0.8);
                    alarmGlow(ctx, w, h, engine);
                    const fadeOut = Math.min(t / 1200, 1);
                    ctx.fillStyle = `rgba(0,0,0,${fadeOut})`;
                    ctx.fillRect(0, 0, w, h);
                    if (t > 1400) endIntro();
                }
            },
            onEnd: () => {
                engine.screenShake = 0;
                engine.goToRoom('broom_closet', 320, 310);
            }
        });
    };

    // ========== DRAWING HELPERS ==========

    /** Draw a dithered rectangle (checkerboard pattern of two colors — classic EGA look) */
    function ditherRect(ctx, x, y, w, h, c1, c2, patternSize) {
        const ps = patternSize || 2;
        ctx.fillStyle = c1;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = c2;
        for (let py = y; py < y + h; py += ps) {
            const offset = ((py - y) / ps) % 2 === 0 ? 0 : ps;
            for (let px = x + offset; px < x + w; px += ps * 2) {
                ctx.fillRect(px, py, ps, ps);
            }
        }
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
        ctx.fillStyle = base;
        ctx.fillRect(x, y, w, h);
        const pw = 55;
        for (let px = x + 4; px < x + w - 4; px += pw + 4) {
            const rw = Math.min(pw, x + w - px - 4);
            ctx.fillStyle = panel;
            ctx.fillRect(px, y + 4, rw, h - 8);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.strokeRect(px, y + 4, rw, h - 8);
        }
    }

    function metalFloor(ctx, y, w, h, color1, color2) {
        ctx.fillStyle = color1 || '#484860';
        ctx.fillRect(0, y, w, h);
        ctx.strokeStyle = color2 || '#3a3a50';
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
        }
    }

    function alarmGlow(ctx, w, h, eng) {
        const pulse = Math.floor(eng.animTimer / 500) % 2;
        if (pulse) {
            ctx.fillStyle = 'rgba(255,0,0,0.12)';
            ctx.fillRect(0, 0, w, h);
        }
    }

    function alarmLight(ctx, x, y, eng) {
        const on = Math.floor(eng.animTimer / 500) % 2;
        ctx.fillStyle = on ? '#FF5555' : '#AA0000';
        ctx.fillRect(x, y, 22, 10);
        ctx.fillRect(x + 2, y - 3, 18, 3);
        if (on) {
            ctx.fillStyle = 'rgba(255,50,50,0.15)';
            ctx.beginPath();
            ctx.arc(x + 11, y + 5, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function gradientRect(ctx, x, y, w, h, c1, c2, vertical) {
        const g = vertical !== false
            ? ctx.createLinearGradient(x, y, x, y + h)
            : ctx.createLinearGradient(x, y, x + w, y);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
    }

    // ========== CUTSCENE DRAWING FUNCTIONS ==========

    function drawShipSilhouette(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#556';
        // Main hull
        ctx.beginPath();
        ctx.moveTo(-60, 0); ctx.lineTo(-40, -12); ctx.lineTo(50, -10);
        ctx.lineTo(65, -4); ctx.lineTo(65, 4); ctx.lineTo(50, 10);
        ctx.lineTo(-40, 12); ctx.lineTo(-60, 0);
        ctx.closePath(); ctx.fill();
        // Bridge
        ctx.fillStyle = '#668';
        ctx.fillRect(30, -6, 18, 12);
        // Engine glow
        ctx.fillStyle = '#4af';
        ctx.fillRect(-62, -3, 4, 6);
        ctx.restore();
    }

    function drawEscapePod(ctx, x, y, scale, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle || 0);
        ctx.scale(scale, scale);
        // Pod body
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Window
        ctx.fillStyle = '#5cf';
        ctx.beginPath();
        ctx.ellipse(4, -1, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Heat shield
        ctx.fillStyle = '#888';
        ctx.fillRect(-13, -3, 3, 6);
        ctx.restore();
    }

    function drawShuttleCraft(ctx, x, y, scale, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle || 0);
        ctx.scale(scale, scale);
        // Fuselage
        ctx.fillStyle = '#99a';
        ctx.beginPath();
        ctx.moveTo(-20, 0); ctx.lineTo(-12, -8); ctx.lineTo(20, -6);
        ctx.lineTo(25, 0); ctx.lineTo(20, 6); ctx.lineTo(-12, 8);
        ctx.closePath(); ctx.fill();
        // Wings
        ctx.fillStyle = '#778';
        ctx.beginPath();
        ctx.moveTo(-5, -8); ctx.lineTo(5, -18); ctx.lineTo(15, -18); ctx.lineTo(10, -6);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-5, 8); ctx.lineTo(5, 18); ctx.lineTo(15, 18); ctx.lineTo(10, 6);
        ctx.closePath(); ctx.fill();
        // Cockpit
        ctx.fillStyle = '#5cf';
        ctx.beginPath();
        ctx.ellipse(15, 0, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Engine glow
        ctx.fillStyle = '#f84';
        ctx.fillRect(-22, -3, 4, 6);
        ctx.restore();
    }

    function drawDraknoidShip(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        // Dark angular hull
        ctx.fillStyle = '#2a3328';
        ctx.beginPath();
        ctx.moveTo(-80, 0); ctx.lineTo(-40, -25); ctx.lineTo(60, -20);
        ctx.lineTo(80, -8); ctx.lineTo(80, 8); ctx.lineTo(60, 20);
        ctx.lineTo(-40, 25); ctx.lineTo(-80, 0);
        ctx.closePath(); ctx.fill();
        // Command tower
        ctx.fillStyle = '#3a4338';
        ctx.fillRect(10, -30, 40, 15);
        // Armor plating lines
        ctx.strokeStyle = '#1a2318';
        ctx.lineWidth = 1;
        for (let i = -30; i < 70; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, -18); ctx.lineTo(i + 10, 18); ctx.stroke();
        }
        // Red viewport
        ctx.fillStyle = '#f22';
        ctx.fillRect(50, -5, 6, 10);
        // Green engine glow
        ctx.fillStyle = '#4f4';
        ctx.fillRect(-82, -4, 4, 8);
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
            ctx.fillStyle = '#555';
            ctx.fillRect(300, h * 0.7 - 3, 80, 6);
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
            // Running player
            const runFrame = Math.floor(elapsed / 150) % 2;
            const px = w * 0.5 + Math.sin(elapsed * 0.005) * 10;
            // Body
            ctx.fillStyle = '#6688aa';
            ctx.fillRect(px - 6, h * 0.65 - 35, 12, 25);
            // Head
            ctx.fillStyle = '#ddb088';
            ctx.beginPath(); ctx.arc(px, h * 0.65 - 42, 7, 0, Math.PI * 2); ctx.fill();
            // Legs (running animation)
            ctx.fillStyle = '#445566';
            if (runFrame) {
                ctx.fillRect(px - 5, h * 0.65 - 10, 4, 14);
                ctx.fillRect(px + 3, h * 0.65 - 8, 4, 10);
            } else {
                ctx.fillRect(px - 5, h * 0.65 - 8, 4, 10);
                ctx.fillRect(px + 3, h * 0.65 - 10, 4, 14);
            }
            // Arms swinging
            ctx.fillStyle = '#ddb088';
            ctx.fillRect(px + 6, h * 0.65 - 30 + runFrame * 4, 3, 10);
            // Holding Quantum Drive (AGI-style: solid color halo)
            ctx.fillStyle = '#55FFFF';
            ctx.fillRect(px + 6, h * 0.65 - 30 + runFrame * 4 - 2, 10, 10);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(px + 8, h * 0.65 - 28 + runFrame * 4, 6, 6);
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

    // ========== MINI-ANIMATION HELPERS ==========
    // Redraws current room background + draws player in a custom pose
    function miniAnimRedrawRoom(ctx, w, h) {
        const room = engine.rooms[engine.currentRoomId];
        if (room && room.draw) room.draw(ctx, w, h, engine);
    }

    function drawPlayerBody(ctx, px, py, s, armAngle) {
        // Simplified front-facing player for mini-anims
        // Legs
        ctx.fillStyle = '#2828AA';
        ctx.fillRect(px - 4 * s, py + 1 * s, 3 * s, 8 * s);
        ctx.fillRect(px + 1 * s, py + 1 * s, 3 * s, 8 * s);
        // Boots
        ctx.fillStyle = '#222222';
        ctx.fillRect(px - 5 * s, py + 9 * s, 4 * s, 3 * s);
        ctx.fillRect(px + 0 * s, py + 9 * s, 4 * s, 3 * s);
        // Body
        ctx.fillStyle = '#4444DD';
        ctx.fillRect(px - 5 * s, py - 10 * s, 10 * s, 11 * s);
        // Collar
        ctx.fillStyle = '#CCAA44';
        ctx.fillRect(px - 4 * s, py - 10 * s, 8 * s, 1 * s);
        // Belt
        ctx.fillStyle = '#666666';
        ctx.fillRect(px - 5 * s, py, 10 * s, 2 * s);
        ctx.fillStyle = '#DDCC22';
        ctx.fillRect(px - 1.5 * s, py - 0.5 * s, 3 * s, 2.5 * s);
        // Head
        ctx.fillStyle = '#FFCC88';
        ctx.fillRect(px - 4 * s, py - 18 * s, 8 * s, 8 * s);
        // Hair
        ctx.fillStyle = '#BB7733';
        ctx.fillRect(px - 4 * s, py - 19 * s, 8 * s, 4 * s);
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 3 * s, py - 15 * s, 2.5 * s, 2 * s);
        ctx.fillRect(px + 0.5 * s, py - 15 * s, 2.5 * s, 2 * s);
        ctx.fillStyle = '#4477CC';
        ctx.fillRect(px - 2.5 * s, py - 15 * s, 1.5 * s, 2 * s);
        ctx.fillRect(px + 1 * s, py - 15 * s, 1.5 * s, 2 * s);
        // Arms (with rotation based on armAngle: 0=down, 1=forward)
        const armOffY = -armAngle * 8 * s;
        ctx.fillStyle = '#4444DD';
        ctx.fillRect(px - 7 * s, py - 8 * s + armOffY, 2 * s, 7 * s);
        ctx.fillRect(px + 5 * s, py - 8 * s + armOffY, 2 * s, 7 * s);
        // Hands
        ctx.fillStyle = '#FFCC88';
        ctx.fillRect(px - 7 * s, py - 1 * s + armOffY, 2 * s, 2.5 * s);
        ctx.fillRect(px + 5 * s, py - 1 * s + armOffY, 2 * s, 2.5 * s);
    }

    // ========== ROOM 1: BROOM CLOSET ==========
    engine.registerRoom({
        id: 'broom_closet',
        name: 'Broom Closet',
        description: 'You wake up groggy in the ship\'s broom closet — your favorite napping spot. Alarms wail. Red lights flash. Something terrible has happened aboard the ISS Constellation.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            e.setFlag('alarm_active');
            // AGI-inspired barriers: shelves, mop bucket, door area
            e.addBarrier(25, 280, 195, 10);   // Lower shelf base blocks walking through it
            e.addBarrier(465, 275, 65, 25);    // Mop bucket
            e.addBarrier(345, 305, 35, 25);    // Floor drain

            // Foreground layer: bucket rim draws over player when walking behind it
            e.addForegroundLayer(300, (ctx, eng) => {
                // Bucket front rim (draws over player walking behind bucket)
                ctx.fillStyle = '#404855';
                ctx.fillRect(474, 255, 46, 3);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Walls
            metalWall(ctx, 0, 0, w, 275, '#38384e', '#3e3e58');
            metalFloor(ctx, 275, w, 125);

            // Ceiling pipes
            ctx.fillStyle = '#505065';
            ctx.fillRect(0, 0, w, 8);
            ctx.fillStyle = '#5a5a70';
            ctx.fillRect(90, 4, 6, 22);
            ctx.fillRect(380, 4, 6, 22);
            ctx.fillRect(530, 4, 6, 22);

            // Left shelves
            ctx.fillStyle = '#5a5a6e';
            ctx.fillRect(25, 88, 190, 6);
            ctx.fillRect(25, 155, 190, 6);
            // Brackets
            ctx.fillStyle = '#4a4a5e';
            ctx.fillRect(35, 88, 4, 25); ctx.fillRect(205, 88, 4, 25);
            ctx.fillRect(35, 155, 4, 25); ctx.fillRect(205, 155, 4, 25);

            // Stuff on top shelf
            // Astro-Shine spray bottle
            ctx.fillStyle = '#5080a0';
            ctx.fillRect(48, 72, 14, 16); // body
            ctx.fillStyle = '#6090b0';
            ctx.fillRect(50, 74, 10, 12);
            ctx.fillStyle = '#4070a0';
            ctx.fillRect(52, 66, 8, 8); // nozzle top
            ctx.fillRect(58, 69, 6, 3); // trigger
            ctx.fillStyle = '#fff';
            ctx.font = '4px "Courier New"';
            ctx.fillText('A-S', 50, 82);

            // Zero-G dust cloth box
            ctx.fillStyle = '#6a8858';
            ctx.fillRect(78, 73, 32, 15);
            ctx.fillStyle = '#7a9868';
            ctx.fillRect(80, 75, 28, 11);
            ctx.fillStyle = '#fff';
            ctx.font = '5px "Courier New"';
            ctx.fillText('DUST', 82, 82);
            ctx.fillText('CLOTH', 81, 87);

            // Tall purple bottle (leaking!)
            ctx.fillStyle = '#7040a0';
            ctx.fillRect(128, 64, 12, 24);
            ctx.fillStyle = '#8050b0';
            ctx.fillRect(130, 66, 8, 20);
            ctx.fillStyle = '#604090';
            ctx.fillRect(131, 62, 6, 4); // cap
            ctx.fillStyle = '#ff0';
            ctx.font = '4px "Courier New"';
            ctx.fillText('???', 129, 78);
            // Purple drip from bottom of bottle down shelf edge
            ctx.fillStyle = '#8050c0';
            ctx.fillRect(133, 88, 3, 6);
            ctx.fillRect(132, 93, 4, 3);
            // Purple drips down wall (slow intermittent drops, not a line)
            ctx.fillStyle = 'rgba(120,60,180,0.7)';
            // Stationary drip blobs clinging to wall at intervals
            ctx.beginPath(); ctx.ellipse(134, 105, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(133, 122, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.5)';
            ctx.beginPath(); ctx.ellipse(134, 138, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
            // Animated drip falling between shelf and lower shelf
            const wallDrip = (eng.animTimer % 3200) / 3200;
            if (wallDrip < 0.6) {
                const wd = wallDrip / 0.6;
                ctx.fillStyle = `rgba(120,60,180,${0.5 + wd * 0.2})`;
                ctx.beginPath(); ctx.ellipse(134, 96 + wd * 55, 1.5 + wd * 0.5, 2 + wd, 0, 0, Math.PI * 2); ctx.fill();
            }
            // Purple puddle on lower shelf
            ctx.fillStyle = 'rgba(110,50,170,0.5)';
            ctx.beginPath(); ctx.ellipse(134, 155, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Purple drips from lower shelf to floor (intermittent blobs)
            ctx.fillStyle = 'rgba(120,60,180,0.45)';
            ctx.beginPath(); ctx.ellipse(134, 175, 1.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.35)';
            ctx.beginPath(); ctx.ellipse(133, 200, 2, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(134, 228, 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(120,60,180,0.25)';
            ctx.beginPath(); ctx.ellipse(133, 252, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
            // Animated drip falling from lower shelf to floor
            const floorDrip = (eng.animTimer % 2800) / 2800;
            if (floorDrip < 0.7) {
                const fd = floorDrip / 0.7;
                ctx.fillStyle = `rgba(120,60,180,${0.4 + fd * 0.2})`;
                ctx.beginPath(); ctx.ellipse(134, 160 + fd * 110, 1.5 + fd * 0.5, 2 + fd, 0, 0, Math.PI * 2); ctx.fill();
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
                const dropY = 275 + fallP * 10;
                const dropSize = 2.5 * (1 - fallP * 0.4);
                ctx.fillStyle = `rgba(130,60,200,${0.7 - fallP * 0.3})`;
                ctx.beginPath(); ctx.ellipse(134, dropY, dropSize * 0.7, dropSize, 0, 0, Math.PI * 2); ctx.fill();
                // Tiny splash ring at impact
                if (fallP > 0.8) {
                    const splashP = (fallP - 0.8) / 0.2;
                    ctx.strokeStyle = `rgba(140,70,210,${0.5 - splashP * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.ellipse(134, 281, 3 + splashP * 6, 1.5 + splashP * 2, 0, 0, Math.PI * 2); ctx.stroke();
                }
            }
            // Purple puddle on floor
            ctx.fillStyle = 'rgba(110,50,170,0.35)';
            ctx.beginPath(); ctx.ellipse(135, 280, 16, 5, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(130,70,200,0.2)';
            ctx.beginPath(); ctx.ellipse(138, 282, 20, 7, 0.1, 0, Math.PI * 2); ctx.fill();

            // Air freshener can
            ctx.fillStyle = '#4080a8';
            ctx.fillRect(170, 70, 14, 18);
            ctx.fillStyle = '#50a0c0';
            ctx.fillRect(172, 72, 10, 14);
            ctx.fillStyle = '#3070a0';
            ctx.beginPath(); ctx.arc(177, 69, 3, Math.PI, 0); ctx.fill(); // dome top
            ctx.fillStyle = '#fff';
            ctx.font = '4px "Courier New"';
            ctx.fillText('AIR', 173, 80);
            ctx.fillText('FRSH', 171, 85);

            // Bottom shelf items
            // Detergent jug
            ctx.fillStyle = '#aa8844';
            ctx.fillRect(42, 136, 18, 19);
            ctx.fillStyle = '#bb9955';
            ctx.fillRect(44, 138, 14, 15);
            ctx.fillStyle = '#aa8844';
            ctx.fillRect(47, 132, 8, 6); // handle
            ctx.fillRect(49, 132, 4, 4);
            ctx.fillStyle = '#fff';
            ctx.font = '4px "Courier New"';
            ctx.fillText('SOAP', 44, 147);

            // Stack of rags/cloths
            ctx.fillStyle = '#8a8878';
            ctx.fillRect(78, 143, 30, 12);
            ctx.fillStyle = '#9a9888';
            ctx.fillRect(80, 140, 26, 5);
            ctx.fillStyle = '#7a7868';
            ctx.fillRect(82, 137, 22, 5);
            // Fraying edges
            ctx.fillStyle = '#aaaa98';
            for (let i = 0; i < 4; i++) ctx.fillRect(79 + i * 8, 155, 3, 2);

            // Coupon sticking out from rags
            ctx.fillStyle = '#ddcc88';
            ctx.fillRect(100, 148, 12, 7);
            ctx.fillStyle = '#cc2222';
            ctx.font = '3px "Courier New"';
            ctx.fillText('M.B.', 101, 153);

            // Old polish tin
            ctx.fillStyle = '#707070';
            ctx.beginPath(); ctx.ellipse(175, 148, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#808080';
            ctx.beginPath(); ctx.ellipse(175, 146, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#999';
            ctx.font = '4px "Courier New"';
            ctx.fillText('POLSH', 166, 149);

            // Mop & bucket (right side)
            ctx.fillStyle = '#606575';
            ctx.beginPath();
            ctx.moveTo(480, 245); ctx.lineTo(470, 275); ctx.lineTo(525, 275); ctx.lineTo(515, 245);
            ctx.closePath(); ctx.fill();
            // Gray water in bucket
            ctx.fillStyle = '#707580';
            ctx.fillRect(474, 248, 46, 12);
            ctx.fillStyle = '#656a75';
            ctx.beginPath(); ctx.ellipse(497, 248, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
            // Bucket rim
            ctx.fillStyle = '#404855';
            ctx.fillRect(474, 255, 46, 3);
            if (!eng.getFlag('has_mop_handle')) {
                // Full mop with handle
                ctx.fillStyle = '#AA8844';
                ctx.fillRect(503, 130, 4, 145);
                ctx.fillStyle = '#CCCCAA';
                ctx.fillRect(494, 268, 22, 10);
                ctx.fillStyle = '#BBBB99';
                for (let i = 0; i < 5; i++) ctx.fillRect(496 + i * 4, 275, 2, 6);
            } else {
                // Mop head flopped on floor, handle taken
                ctx.fillStyle = '#CCCCAA';
                ctx.fillRect(485, 278, 26, 6);
                ctx.fillStyle = '#BBBB99';
                for (let i = 0; i < 6; i++) ctx.fillRect(486 + i * 4, 284, 2, 4);
                // Broken stub where handle was
                ctx.fillStyle = '#886633';
                ctx.fillRect(496, 270, 4, 8);
            }

            // Door (center)
            if (eng.getFlag('closet_door_open')) {
                // Door forced open - corridor visible through gap
                ctx.fillStyle = '#2a1a1a';
                ctx.fillRect(270, 42, 100, 233);
                // Red emergency glow from corridor
                ctx.fillStyle = 'rgba(180,40,40,0.25)';
                ctx.fillRect(275, 48, 90, 221);
                // Corridor floor visible
                ctx.fillStyle = '#3a3a50';
                ctx.fillRect(275, 230, 90, 39);
                // Door panels shoved aside
                ctx.fillStyle = '#4e5e72';
                ctx.fillRect(263, 42, 14, 233);
                ctx.fillStyle = '#4e5e72';
                ctx.fillRect(363, 42, 14, 233);
                // Bent frame
                ctx.fillStyle = '#3e4e62';
                ctx.fillRect(270, 42, 100, 4);
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
                ctx.fillRect(270, 42, 100, 233);
                ctx.fillStyle = '#5a6e84';
                ctx.fillRect(276, 48, 88, 221);
                ctx.fillStyle = '#3e4e62';
                ctx.fillRect(318, 48, 4, 221);
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

            // Floor details - grating pattern
            ctx.fillStyle = '#3e3e55';
            for (let x = 0; x < w; x += 80) ctx.fillRect(x, 275, 1, 125);
            // Floor drain
            ctx.fillStyle = '#2a2a40';
            ctx.fillRect(350, 310, 30, 20);
            ctx.strokeStyle = '#3a3a50';
            ctx.lineWidth = 1;
            for (let dy = 0; dy < 20; dy += 4) {
                ctx.beginPath(); ctx.moveTo(352, 312 + dy); ctx.lineTo(378, 312 + dy); ctx.stroke();
            }
            // Vent grille on wall
            ctx.fillStyle = '#454560';
            ctx.fillRect(430, 90, 45, 30);
            ctx.fillStyle = '#3a3a55';
            for (let vy = 0; vy < 26; vy += 5) {
                ctx.fillRect(432, 93 + vy, 41, 2);
            }
            // Dust particles under vent
            ctx.fillStyle = 'rgba(120,120,140,0.15)';
            ctx.fillRect(440, 120, 25, 15);

            // Safety poster on right wall
            ctx.fillStyle = '#888855';
            ctx.fillRect(540, 100, 50, 60);
            ctx.fillStyle = '#AAAA77';
            ctx.fillRect(542, 102, 46, 56);
            ctx.fillStyle = '#CC2222';
            ctx.font = '7px "Courier New"';
            ctx.fillText('SAFETY', 546, 118);
            ctx.fillText('FIRST!', 548, 128);
            // Stick figure on poster
            ctx.fillStyle = '#333333';
            ctx.fillRect(560, 132, 2, 12);
            ctx.fillRect(555, 137, 12, 2);
            ctx.beginPath(); ctx.arc(561, 130, 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#333333'; ctx.stroke();
            ctx.fillStyle = '#222222';
            ctx.font = '5px "Courier New"';
            ctx.fillText('0 DAYS', 548, 150);
            ctx.fillText('WITHOUT', 547, 155);

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
                name: 'Door', x: 270, y: 42, w: 100, h: 233, isExit: true, walkToX: 320, walkToY: 280,
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
                        e.goToRoom('corridor', 320, 310);
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
                name: 'Shelves', x: 25, y: 55, w: 195, h: 115,
                description: 'Metal shelves stacked with cleaning supplies.',
                look: (e) => e.showMessage('Rusty shelves holding assorted cleaning supplies — Astro-Shine polish, Zero-G dust cloths, a leaking bottle of something purple, and industrial-strength air freshener. Nothing useful for survival.'),
                get: (e) => e.showMessage('You rummage through the cleaning supplies. Some detergent, old rags, and a coupon for "Monolith Burger" that expired two years ago. Nothing helpful.'),
                use: (e) => e.showMessage('What are you going to do, clean up? The ship is under attack! Though you do feel a professional twinge of guilt about that purple stain...'),
                talk: (e) => e.showMessage('"Hello, cleaning supplies. It\'s me, your old friend." They do not respond. Probably for the best.')
            },
            {
                name: 'Astro-Shine Bottle', x: 45, y: 62, w: 20, h: 28,
                description: 'A spray bottle of Astro-Shine polish.',
                look: (e) => e.showMessage('"Astro-Shine All-Surface Polish — Makes Any Metal Gleam Like New!" You\'ve gone through about fifty of these. This one\'s nearly empty.'),
                get: (e) => e.showMessage('You grab the Astro-Shine bottle and give it a shake. Almost empty. Not worth the inventory space.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = 1.85 + (py - 280) / 90 * 0.3;
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
                name: 'Zero-G Dust Cloths', x: 76, y: 70, w: 36, h: 20,
                description: 'A box of Zero-G dust cloths.',
                look: (e) => e.showMessage('"Zero-G Dust Cloths — For When Dust Doesn\'t Settle!" Specially designed for cleaning in artificial gravity environments. The box is half empty.'),
                get: (e) => e.showMessage('You pull out a dust cloth. It\'s just a cloth. You put it back.'),
                use: (e) => e.showMessage('You wipe down the nearest surface with a cloth. Habit. The ship lurches violently. Okay, enough cleaning.')
            },
            {
                name: 'Purple Bottle', x: 126, y: 58, w: 16, h: 32,
                description: 'A tall bottle of mysterious purple liquid.',
                look: (e) => e.showMessage('A tall bottle with no proper label — just "???" scrawled in yellow marker. The cap is loose and purple liquid has been slowly leaking down the shelf for months. The liquid seems to glow faintly. You\'ve filed three maintenance reports about this. All ignored.'),
                get: (e) => e.showMessage('You reach for the bottle and your fingers tingle on contact. It\'s warm. Unnervingly warm. You decide to leave it where it is. Some mysteries are better left unsolved.'),
                use: (e) => e.showMessage('You tighten the cap. Purple liquid immediately begins seeping through the threads. This bottle does not respect the laws of fluid dynamics.')
            },
            {
                name: 'Air Freshener', x: 168, y: 66, w: 18, h: 24,
                description: 'A can of industrial air freshener.',
                look: (e) => e.showMessage('"FreshAir Industrial Odor Neutralizer — Starship Strength." You need this stuff. A ship full of crew who think deodorant is optional. The can feels light — almost empty, like your will to live.'),
                get: (e) => e.showMessage('You pick it up and shake it. Barely a rattle. Even at full capacity it couldn\'t mask what\'s happening to this ship right now.'),
                use: (e) => {
                    const px = engine.playerX, py = engine.playerY;
                    const sc = 1.85 + (py - 280) / 90 * 0.3;
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
                name: 'Detergent Jug', x: 40, y: 130, w: 22, h: 26,
                description: 'A jug of industrial detergent.',
                look: (e) => e.showMessage('"SoapMaster 3000 — Cuts Through Grease and Alien Residue!" About a quarter full. The label claims it\'s lemon-scented but it smells more like a chemical plant on fire.'),
                get: (e) => e.showMessage('It\'s heavy and sloshy. You\'d rather not lug a jug of detergent around while fleeing for your life.'),
                use: (e) => e.showMessage('You consider pouring some on the purple puddle. Then again, mixing unknown chemicals with mysterious alien goo seems like a bad idea. Even for you.')
            },
            {
                name: 'Stack of Rags', x: 76, y: 135, w: 34, h: 22,
                description: 'A pile of worn cleaning rags.',
                look: (e) => e.showMessage('A stack of well-used cleaning rags in various states of decay. Some are stiff with dried polish, others are suspiciously stained. A coupon for Monolith Burger is sticking out — expired two years ago.'),
                get: (e) => e.showMessage('You grab a rag, then put it back. What are you going to do, wipe your way to safety?'),
                use: (e) => e.showMessage('You absentmindedly fold the top rag. Neat edges. There. At least SOMETHING on this ship is in order.')
            },
            {
                name: 'Polish Tin', x: 163, y: 138, w: 22, h: 18,
                description: 'A tin of metal polish.',
                look: (e) => e.showMessage('An old tin of "Star-Brite Metal Polish." The lid is rusted shut, which is ironic for a product that\'s supposed to prevent rust. It\'s been here since before you started this job.'),
                get: (e) => e.showMessage('The tin is stuck to the shelf. Literally. Something has glued it in place. Probably that purple stuff.'),
                use: (e) => e.showMessage('You try to open the lid. It\'s welded shut by time and neglect. Just like your career prospects.')
            },
            {
                name: 'Mop & Bucket', x: 465, y: 125, w: 65, h: 165,
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
                        const sc = 1.85 + (py - 280) / 90 * 0.3;
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
                                }
                            },
                            onEnd: () => {
                                // Restore the mop to the wall — player just used it, didn't take it
                                engine.flags.delete('has_mop_handle');
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
                name: 'Purple Puddle', x: 110, y: 270, w: 55, h: 25,
                description: 'A puddle of mysterious purple fluid.',
                look: (e) => { if (!engine.getFlag('looked_puddle')) { engine.setFlag('looked_puddle'); e.addScore(2); } e.showMessage('A slowly expanding puddle of purple liquid, dripping from a bottle on the shelf above. You\'ve been meaning to clean that up for six months. It\'s developed a faint glow. That\'s... probably fine.'); },
                get: (e) => e.showMessage('You cup your hands and try to scoop up the purple goo. It slips through your fingers and leaves them tingling. And slightly purple. That\'ll wash out. Probably.'),
                use: (e) => e.showMessage('You consider mopping it up but then remember: the ship is exploding. Priorities, Wilkins. Priorities.'),
                talk: (e) => e.showMessage('"What ARE you?" you ask the puddle. It bubbles. You decide not to ask again.')
            },
            {
                name: 'Safety Poster', x: 540, y: 100, w: 50, h: 60,
                description: 'A safety awareness poster.',
                look: (e) => { if (!engine.getFlag('looked_poster')) { engine.setFlag('looked_poster'); e.addScore(3); } e.showMessage('"SAFETY FIRST!" declares the poster, featuring a cheerful stick figure. Below it reads "0 DAYS WITHOUT AN INCIDENT." Someone has written "THANKS, WILKINS" underneath in marker.'); },
                get: (e) => e.showMessage('You consider taking the poster as a souvenir. Then you notice it\'s bolted to the wall. Someone clearly anticipated this.'),
                use: (e) => e.showMessage('You update the counter to read "0 DAYS WITHOUT AN INCIDENT." Although technically an alien attack might be more than just an "incident."'),
                talk: (e) => e.showMessage('"I\'m sorry, little stick figure," you whisper. "I tried my best." The stick figure stares back with its empty circle head, judging you.')
            },
            {
                name: 'Vent Grille', x: 430, y: 90, w: 45, h: 30,
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
        name: 'Ship Corridor',
        description: 'The main corridor of the ISS Constellation. Emergency lights cast an eerie red glow over devastation. Blast marks scar the walls. The ship has been attacked.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            // AGI-inspired barriers: fallen crew member, debris
            e.addBarrier(320, 325, 65, 20);    // Dr. Chen's body
            e.addBarrier(230, 315, 25, 15);    // Debris cluster left
            e.addBarrier(415, 345, 20, 15);    // Debris cluster right

            // Edge transitions for corridor (AGI EGOEDGE/NEWROOM)
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('broom_closet', 320, 310);
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
            ctx.fillStyle = '#282848';
            ctx.fillRect(200, 55, 240, 200);
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
            ctx.fillStyle = '#0000AA';
            ctx.beginPath();
            ctx.moveTo(0, 275); ctx.lineTo(200, 255); ctx.lineTo(440, 255);
            ctx.lineTo(640, 275); ctx.lineTo(640, 400); ctx.lineTo(0, 400);
            ctx.closePath(); ctx.fill();
            // Dithered floor texture (EGA-style)
            ditherRect(ctx, 0, 340, w, 60, '#0000AA', '#000000', 4);
            // Floor lines
            ctx.strokeStyle = '#000000';
            for (let i = 0; i < 10; i++) {
                const y = 275 + i * 14;
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
            }

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
            // Lab label
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#88AACC';
            ctx.fillText('SCIENCE', 30, 140);
            ctx.fillText('  LAB', 30, 153);

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
            // Pod label
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#88AACC';
            ctx.fillText('ESCAPE', 552, 140);
            ctx.fillText(' PODS', 552, 153);
            // Keycard reader — on wall next to door
            ctx.fillStyle = eng.getFlag('pod_bay_unlocked') ? '#22AA22' : '#AA2222';
            ctx.fillRect(534, 170, 6, 10);

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
            ctx.fillRect(365, 340, 15, 4);
            ctx.fillRect(370, 338, 8, 3);

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

            // Fallen crew member (Dr. Chen)
            // Torso
            ctx.fillStyle = '#884444';
            ctx.fillRect(330, 330, 50, 14);
            // Lab coat
            ctx.fillStyle = '#998888';
            ctx.fillRect(332, 330, 46, 12);
            // Head
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(380, 325, 14, 14);
            // Dark hair
            ctx.fillStyle = '#222233';
            ctx.fillRect(380, 325, 14, 5);
            ctx.fillRect(392, 325, 3, 10);
            // Arm outstretched
            ctx.fillStyle = '#998888';
            ctx.fillRect(323, 335, 10, 4);
            // Hand
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(318, 335, 6, 4);

            // KEYCARD on body — only visible before pickup
            if (!eng.getFlag('got_keycard_corridor')) {
                const kcx = 338, kcy = 330;
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
            if (eng.getFlag('examined_crew')) {
                ctx.fillStyle = '#222233';
                ctx.fillRect(384, 331, 2, 1);
                ctx.fillRect(389, 331, 2, 1);
            }

            // Emergency lights
            alarmLight(ctx, 140, 6, eng);
            alarmLight(ctx, 480, 6, eng);
            alarmLight(ctx, 295, 57, eng);
            alarmGlow(ctx, w, h, eng);
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
                        e.showMessage('The keycard reader flashes red. ACCESS DENIED. You need a Level 3 security keycard.');
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
                name: 'Fallen Crew Member', x: 325, y: 322, w: 70, h: 26,
                description: 'Someone lies motionless on the floor.',
                look: (e) => {
                    e.showMessage('It\'s Dr. Chen from the xenophysics team. She didn\'t make it. Whatever hit the ship was fast and merciless. You notice her security keycard is still clipped to her uniform pocket.');
                    e.setFlag('examined_crew');
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
            }
        ]
    });

    // ========== ROOM 3: SCIENCE LAB ==========
    engine.registerRoom({
        id: 'science_lab',
        name: 'Science Lab',
        description: 'The ship\'s science lab. Equipment is smashed and overturned, but some computers still flicker with power. The attackers were looking for something specific.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_alarm');
            // AGI-inspired barriers: lab table legs, overturned chair
            e.addBarrier(245, 280, 180, 8);    // Lab table base spans walkable area
            e.addBarrier(195, 285, 35, 25);    // Overturned chair

            // Foreground layer: lab table edge draws over player walking behind it
            e.addForegroundLayer(285, (ctx, eng) => {
                ctx.fillStyle = '#555570';
                ctx.fillRect(240, 268, 185, 4); // Table front edge
            });

            // Edge transition: right side back to corridor
            e.setEdgeTransition('right', (eng) => {
                eng.goToRoom('corridor', 120, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Walls and floor
            metalWall(ctx, 0, 0, w, 270, '#2e2e48', '#343458');
            metalFloor(ctx, 270, w, 130, '#404058', '#353550');

            // Ceiling with light strips
            ctx.fillStyle = '#222240';
            ctx.fillRect(0, 0, w, 12);
            // Flickering light
            const lightOn = Math.floor(eng.animTimer / 300) % 3 !== 0;
            ctx.fillStyle = lightOn ? '#aabbcc' : '#334455';
            ctx.fillRect(200, 4, 240, 5);

            // Large computer terminal (left)
            ctx.fillStyle = '#2a3040';
            ctx.fillRect(30, 60, 160, 180);
            ctx.fillStyle = '#1a2030';
            ctx.fillRect(40, 70, 140, 100);
            // Screen glow
            if (lightOn) {
                ctx.fillStyle = '#112244';
                ctx.fillRect(44, 74, 132, 92);
                // Text on screen
                ctx.fillStyle = '#33AA55';
                ctx.font = '9px "Courier New"';
                ctx.fillText('SYSTEM CRITICAL', 52, 90);
                ctx.fillText('HULL BREACH: DECK 3', 52, 104);
                ctx.fillText('LIFE SUPPORT: 47%', 52, 118);
                ctx.fillText('CREW STATUS: 1 ALIVE', 52, 132);
                ctx.fillStyle = '#FFAA22';
                ctx.fillText('> DATA PORT ACTIVE_', 52, 150);
            }
            // Keyboard
            ctx.fillStyle = '#383848';
            ctx.fillRect(50, 175, 120, 15);
            ctx.fillStyle = '#444458';
            for (let kx = 55; kx < 165; kx += 8) {
                ctx.fillRect(kx, 178, 5, 3);
                ctx.fillRect(kx + 2, 184, 5, 3);
            }

            // Data cartridge slot
            if (!eng.getFlag('got_cartridge')) {
                ctx.fillStyle = '#CCAA33';
                ctx.fillRect(155, 172, 12, 6);
                ctx.fillStyle = '#DDBB44';
                ctx.fillRect(157, 173, 8, 4);
            }

            // Lab tables (center)
            ctx.fillStyle = '#3a3a52';
            ctx.fillRect(240, 180, 180, 8);
            // Table legs
            ctx.fillRect(250, 188, 6, 80);
            ctx.fillRect(410, 188, 6, 80);
            // Broken equipment on table
            ctx.fillStyle = '#555568';
            ctx.fillRect(260, 160, 40, 20);
            ctx.fillStyle = '#445055';
            ctx.fillRect(320, 165, 50, 15);
            ctx.fillStyle = '#665555';
            ctx.fillRect(390, 155, 25, 25);
            // Broken glass
            ctx.fillStyle = 'rgba(150,180,200,0.3)';
            ctx.fillRect(280, 290, 15, 3);
            ctx.fillRect(310, 300, 10, 2);
            ctx.fillRect(350, 285, 12, 3);

            // Right side - specimen cases (smashed)
            ctx.fillStyle = '#2a3040';
            ctx.fillRect(480, 50, 130, 200);
            ctx.strokeStyle = '#444460';
            ctx.strokeRect(488, 58, 114, 60);
            ctx.strokeRect(488, 126, 114, 60);
            ctx.strokeRect(488, 194, 114, 48);
            // Broken glass
            ctx.fillStyle = 'rgba(100,140,180,0.2)';
            ctx.beginPath();
            ctx.moveTo(500, 58); ctx.lineTo(530, 80); ctx.lineTo(490, 100);
            ctx.closePath(); ctx.fill();

            // Door (exit)
            ctx.fillStyle = '#4a5e70';
            ctx.fillRect(560, 70, 65, 200);
            ctx.fillStyle = '#5a7088';
            ctx.fillRect(565, 75, 55, 190);
            ctx.fillStyle = '#8899AA';
            ctx.font = '9px "Courier New"';
            ctx.fillText('EXIT', 578, 165);

            // Overturned chair
            ctx.fillStyle = '#444458';
            ctx.fillRect(200, 300, 30, 20);
            ctx.fillRect(210, 290, 10, 10);

            // Spilled specimen vials on floor
            ctx.fillStyle = '#44CC88';
            ctx.fillRect(350, 310, 6, 16);
            ctx.fillStyle = '#33BB77';
            ctx.fillRect(362, 312, 6, 14);
            ctx.fillStyle = 'rgba(50,200,120,0.15)';
            ctx.beginPath(); ctx.ellipse(362, 326, 12, 5, 0.2, 0, Math.PI * 2); ctx.fill();

            // Microscope still standing (right table area)
            ctx.fillStyle = '#555568';
            ctx.fillRect(392, 148, 6, 30);
            ctx.fillRect(388, 145, 14, 5);
            ctx.fillStyle = '#666678';
            ctx.fillRect(389, 140, 12, 6);
            ctx.fillStyle = '#334455';
            ctx.beginPath(); ctx.arc(395, 138, 4, 0, Math.PI * 2); ctx.fill();

            // Holographic periodic table on wall (partially flickering)
            if (lightOn) {
                ctx.fillStyle = 'rgba(80,150,200,0.12)';
                ctx.fillRect(250, 40, 120, 45);
                ctx.strokeStyle = 'rgba(80,150,200,0.25)';
                ctx.strokeRect(250, 40, 120, 45);
                ctx.fillStyle = 'rgba(100,180,220,0.3)';
                ctx.font = '6px "Courier New"';
                ctx.fillText('Xe  Qn  Zr  Pl  Dk', 255, 52);
                ctx.fillText('Fe  Au  Ag  Cu  Sn', 255, 62);
                ctx.fillText('H   He  Li  Be  B', 255, 72);
            }

            // Smeared footprints (attacker tracks)
            ctx.fillStyle = 'rgba(30,30,30,0.12)';
            ctx.fillRect(300, 290, 12, 16);
            ctx.fillRect(330, 285, 12, 16);
            ctx.fillRect(360, 290, 12, 16);

            // Warning label on specimen case
            ctx.fillStyle = '#CC9922';
            ctx.font = '7px "Courier New"';
            ctx.fillText('⚠ BIOHAZARD', 492, 218);

            alarmLight(ctx, 310, 5, eng);
            alarmGlow(ctx, w, h, eng);
        },
        hotspots: [
            {
                name: 'Computer Terminal', x: 30, y: 55, w: 165, h: 140,
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
                name: 'Data Cartridge', x: 150, y: 168, w: 22, h: 12,
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
                name: 'Specimen Cases', x: 480, y: 45, w: 135, h: 210,
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
                name: 'Exit', x: 555, y: 65, w: 75, h: 210, isExit: true, walkToX: 590,
                description: 'Door back to the corridor.',
                onExit: (e) => e.goToRoom('corridor', 120, 310)
            }
        ]
    });

    // ========== ROOM 4: ESCAPE POD BAY ==========
    engine.registerRoom({
        id: 'pod_bay',
        name: 'Escape Pod Bay',
        description: 'The Escape Pod Bay. Most pods have already launched. One remains — your ticket off this doomed ship.',
        onEnter: (e) => {
            e.sound.startAmbient('ship_hum');
            // AGI-inspired barriers: control panel
            e.addBarrier(440, 290, 80, 30);    // Launch control panel (narrower, doesn't block pod path)

            // Edge transition: left back to corridor
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('corridor', 540, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Bay walls - larger, industrial feel
            // Pod bay walls (EGA dark blue dithered)
            ditherRect(ctx, 0, 0, w, 270, '#000000', '#0000AA', 2);
            metalFloor(ctx, 270, w, 130, '#3a3a55', '#303048');

            // Ceiling
            ctx.fillStyle = '#1e1e3a';
            ctx.fillRect(0, 0, w, 16);
            ctx.fillStyle = '#888';
            ctx.fillRect(150, 8, 340, 4);

            // Empty pod bays (left and center)
            for (let i = 0; i < 3; i++) {
                const bx = 30 + i * 155;
                ctx.fillStyle = '#1a1a35';
                ctx.fillRect(bx, 40, 120, 200);
                ctx.strokeStyle = '#444466';
                ctx.strokeRect(bx, 40, 120, 200);
                // "LAUNCHED" label
                ctx.fillStyle = '#886622';
                ctx.font = '10px "Courier New"';
                ctx.fillText('LAUNCHED', bx + 20, 145);
                // Empty clamp marks
                ctx.fillStyle = '#333355';
                ctx.fillRect(bx + 10, 60, 15, 8);
                ctx.fillRect(bx + 95, 60, 15, 8);
                ctx.fillRect(bx + 10, 210, 15, 8);
                ctx.fillRect(bx + 95, 210, 15, 8);
            }

            // Active pod bay (right) - Pod still here!
            const px = 500;
            ctx.fillStyle = '#1a1a35';
            ctx.fillRect(px, 40, 120, 200);
            ctx.strokeStyle = '#22AA44';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, 40, 120, 200);
            ctx.lineWidth = 1;

            if (!eng.getFlag('pod_launched')) {
                // Pod body - detailed
                ctx.fillStyle = '#667788';
                ctx.fillRect(px + 15, 60, 90, 160);
                ctx.fillStyle = '#778899';
                ctx.fillRect(px + 20, 65, 80, 70);
                // Hull seams
                ctx.strokeStyle = '#556677';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px + 20, 100); ctx.lineTo(px + 100, 100); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + 20, 130); ctx.lineTo(px + 100, 130); ctx.stroke();
                // Rivets
                ctx.fillStyle = '#8899AA';
                for (let ry = 65; ry < 220; ry += 25) {
                    ctx.fillRect(px + 17, ry, 3, 3);
                    ctx.fillRect(px + 100, ry, 3, 3);
                }
                // Pod window - with reflection
                ctx.fillStyle = '#223344';
                ctx.fillRect(px + 35, 75, 50, 40);
                ctx.fillStyle = '#334466';
                ctx.fillRect(px + 38, 78, 44, 34);
                // Window frame
                ctx.strokeStyle = '#556677';
                ctx.strokeRect(px + 35, 75, 50, 40);
                // Stars through window
                ctx.fillStyle = '#AAAACC';
                ctx.fillRect(px + 48, 85, 2, 2);
                ctx.fillRect(px + 62, 92, 1, 1);
                ctx.fillRect(px + 55, 100, 2, 1);
                ctx.fillRect(px + 70, 88, 1, 1);
                ctx.fillRect(px + 44, 95, 1, 2);
                // Window reflection highlight
                ctx.fillStyle = 'rgba(150,180,220,0.15)';
                ctx.fillRect(px + 38, 78, 10, 34);
                // Pod number
                ctx.fillStyle = '#AABBCC';
                ctx.font = 'bold 10px "Courier New"';
                ctx.fillText('POD 4', px + 38, 72);
                // Pod status indicator
                ctx.fillStyle = '#22CC44';
                ctx.font = '8px "Courier New"';
                ctx.fillText('STATUS: READY', px + 25, 148);
                // Status LED
                ctx.fillStyle = '#22FF44';
                ctx.fillRect(px + 18, 142, 5, 5);
                // Entry hatch
                ctx.fillStyle = '#556677';
                ctx.fillRect(px + 30, 155, 60, 55);
                // Hatch seam
                ctx.strokeStyle = '#445566';
                ctx.strokeRect(px + 30, 155, 60, 55);
                // Handle
                ctx.fillStyle = '#CCAA22';
                ctx.fillRect(px + 80, 175, 8, 10);
                ctx.fillStyle = '#DDBB33';
                ctx.fillRect(px + 81, 176, 6, 8);
                // "OPEN" label near handle
                ctx.fillStyle = '#88AA88';
                ctx.font = '5px "Courier New"';
                ctx.fillText('OPEN', px + 70, 190);
                // Warning stripes on hatch
                ctx.fillStyle = '#CCAA22';
                ctx.fillRect(px + 30, 155, 60, 3);
                ctx.fillStyle = '#222222';
                for (let sx = 0; sx < 60; sx += 8) {
                    ctx.fillRect(px + 30 + sx, 155, 4, 3);
                }
            } else {
                ctx.fillStyle = '#886622';
                ctx.font = '10px "Courier New"';
                ctx.fillText('LAUNCHED', px + 20, 145);
            }

            // Emergency locker (lower left)
            ctx.fillStyle = '#445566';
            ctx.fillRect(15, 180, 50, 80);
            ctx.strokeStyle = '#556677';
            ctx.strokeRect(15, 180, 50, 80);
            // Cross symbol
            ctx.fillStyle = eng.getFlag('got_kit') ? '#554433' : '#CC3333';
            ctx.fillRect(32, 195, 16, 4);
            ctx.fillRect(38, 189, 4, 16);
            // Label
            ctx.font = '7px "Courier New"';
            ctx.fillStyle = '#8899AA';
            ctx.fillText('EMRG', 22, 252);

            // Control panel
            ctx.fillStyle = '#333350';
            ctx.fillRect(440, 280, 100, 40);
            ctx.fillStyle = '#444465';
            ctx.fillRect(445, 285, 90, 30);
            // Buttons
            ctx.fillStyle = '#22AA44';
            ctx.fillRect(460, 292, 12, 12);
            ctx.fillStyle = '#AA2222';
            ctx.fillRect(480, 292, 12, 12);
            ctx.fillStyle = '#AAAA22';
            ctx.fillRect(500, 292, 12, 12);

            // Space window (top center)
            ctx.fillStyle = '#060620';
            ctx.fillRect(220, 15, 200, 70);
            ctx.strokeStyle = '#555577';
            ctx.strokeRect(220, 15, 200, 70);
            ctx.save();
            ctx.beginPath();
            ctx.rect(221, 16, 198, 68);
            ctx.clip();
            ctx.translate(220, 15);
            stars(ctx, 200, 70, 777, 30, 0.65);
            ctx.restore();
            // A planet visible
            ctx.fillStyle = '#AA8855';
            ctx.beginPath();
            ctx.arc(350, 55, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#BBAA66';
            ctx.beginPath();
            ctx.arc(350, 55, 18, -0.5, 0.8);
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
                    // Warn about missing critical items
                    if (!e.hasItem('cartridge') && !e.getFlag('pod_warn_cartridge')) {
                        e.showMessage('You hesitate before climbing in. Something nags at you... There\'s a lot of ship you haven\'t searched yet. You feel like you should check the Science Lab before leaving forever.');
                        e.setFlag('pod_warn_cartridge');
                        return;
                    }
                    if (!e.hasItem('survival_kit') && !e.getFlag('got_kit') && !e.getFlag('pod_warn_kit')) {
                        e.showMessage('A survival instinct tells you to check for emergency supplies before launching into the unknown. That locker on the wall looks promising...');
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
                name: 'Emergency Locker', x: 10, y: 175, w: 60, h: 90,
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
                name: 'Space Window', x: 220, y: 15, w: 200, h: 70,
                description: 'A viewport showing space outside.',
                look: (e) => { if (!engine.getFlag('looked_window')) { engine.setFlag('looked_window'); e.addScore(3); } e.showMessage('Through the viewport you can see a desert planet looming close. The Constellation is in a decaying orbit — it won\'t last much longer. You also spot a large alien warship departing. The attackers got what they came for... or did they?'); }
            },
            {
                name: 'Launch Controls', x: 435, y: 275, w: 110, h: 50,
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
                name: 'Empty Pod Bays', x: 30, y: 40, w: 400, h: 200,
                description: 'Empty pod bays.',
                look: (e) => e.showMessage('Three empty pod bays. The rest of the crew launched already... if there was anyone left alive to launch them. Only Pod Bay 4 still has a pod.')
            },
            {
                name: 'Corridor', x: 0, y: 270, w: 80, h: 130, isExit: true, walkToX: 40,
                description: 'Back to the corridor.',
                onExit: (e) => e.goToRoom('corridor', 540, 310)
            }
        ]
    });

    // ========== ROOM 5: DESERT ==========
    engine.registerRoom({
        id: 'desert',
        name: 'Desert Planet',
        description: 'Your pod crashlands on a scorching desert planet. Twin suns blaze overhead. The air is dry as dust. You need to find shelter — fast.',
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
            // Sky with EGA-style dithered bands
            ctx.fillStyle = '#AA5500';
            ctx.fillRect(0, 0, w, 50);
            ditherRect(ctx, 0, 50, w, 50, '#AA5500', '#AA5500', 2);
            ditherRect(ctx, 0, 100, w, 50, '#AA5500', '#FFFF55', 2);
            ditherRect(ctx, 0, 150, w, 50, '#FFFF55', '#FFFF55', 2);

            // Twin suns
            ctx.fillStyle = '#FFEE88';
            ctx.beginPath(); ctx.arc(480, 60, 30, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFEEBB';
            ctx.beginPath(); ctx.arc(480, 60, 26, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = '#FFDD66';
            ctx.beginPath(); ctx.arc(540, 90, 18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FFEEAA';
            ctx.beginPath(); ctx.arc(540, 90, 15, 0, Math.PI * 2); ctx.fill();

            // Sun rays (AGI-style: sparse yellow pixels instead of rgba overlay)
            ctx.fillStyle = '#FFFF55';
            for (let py = 0; py < 200; py += 6) {
                for (let px = ((py / 6) % 2) * 6; px < w; px += 12) {
                    ctx.fillRect(px, py, 1, 1);
                }
            }

            // Distant mountains
            ctx.fillStyle = '#AA7744';
            ctx.beginPath();
            ctx.moveTo(0, 190);
            ctx.lineTo(60, 150); ctx.lineTo(120, 175); ctx.lineTo(200, 140);
            ctx.lineTo(280, 165); ctx.lineTo(360, 130); ctx.lineTo(440, 155);
            ctx.lineTo(520, 135); ctx.lineTo(600, 160); ctx.lineTo(640, 180);
            ctx.lineTo(640, 200); ctx.lineTo(0, 200);
            ctx.closePath(); ctx.fill();

            // Sand with dithered edge
            ditherRect(ctx, 0, 190, w, 20, '#AA5500', '#AA5500', 2);
            // Sand ground (EGA brown)
            ctx.fillStyle = '#AA5500';
            ctx.fillRect(0, 210, w, 190);

            // Sand dunes
            ctx.fillStyle = '#CCAA55';
            ctx.beginPath();
            ctx.moveTo(0, 220); ctx.quadraticCurveTo(160, 195, 320, 215);
            ctx.quadraticCurveTo(480, 235, 640, 210);
            ctx.lineTo(640, 230); ctx.lineTo(0, 230);
            ctx.closePath(); ctx.fill();

            // Sand texture - dots
            ctx.fillStyle = '#C09040';
            for (let i = 0; i < 60; i++) {
                ctx.fillRect(((i * 73 + 17) % 620) + 10, 220 + ((i * 51) % 170), 2, 1);
            }

            // Crashed escape pod
            ctx.fillStyle = '#556677';
            ctx.beginPath();
            ctx.moveTo(80, 290); ctx.lineTo(110, 260); ctx.lineTo(190, 255);
            ctx.lineTo(210, 270); ctx.lineTo(200, 300);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#667788';
            ctx.fillRect(115, 262, 60, 20);
            // Scorch from impact
            ctx.fillStyle = '#554433';
            ctx.fillRect(140, 298, 80, 8);
            ctx.fillRect(120, 302, 100, 4);
            // Smoke
            const smokeTime = eng.animTimer / 800;
            ctx.fillStyle = 'rgba(100,100,100,0.3)';
            ctx.beginPath();
            ctx.arc(150 + Math.sin(smokeTime) * 5, 248 - Math.sin(smokeTime * 0.7) * 8, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(80,80,80,0.2)';
            ctx.beginPath();
            ctx.arc(155 + Math.cos(smokeTime * 1.2) * 4, 235 - Math.sin(smokeTime * 0.5) * 6, 12, 0, Math.PI * 2);
            ctx.fill();

            // Rock formation (north - leads to cave)
            ctx.fillStyle = '#8B6B44';
            ctx.beginPath();
            ctx.moveTo(370, 220); ctx.lineTo(390, 170); ctx.lineTo(410, 180);
            ctx.lineTo(430, 155); ctx.lineTo(460, 195); ctx.lineTo(470, 220);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#7B5B34';
            ctx.beginPath();
            ctx.moveTo(395, 190); ctx.lineTo(410, 180); ctx.lineTo(430, 195);
            ctx.lineTo(420, 210);
            ctx.closePath(); ctx.fill();
            // Cave opening hint
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(405, 195, 20, 25);

            // Alien plant
            ctx.fillStyle = '#558844';
            ctx.fillRect(300, 280, 4, 20);
            ctx.fillStyle = '#669955';
            ctx.beginPath();
            ctx.arc(302, 275, 6, 0, Math.PI * 2); ctx.fill();
            // Plant spines
            ctx.strokeStyle = '#77AA66';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(298, 277); ctx.lineTo(292, 273); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(306, 277); ctx.lineTo(312, 273); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(302, 270); ctx.lineTo(302, 264); ctx.stroke();

            // Second alien plant (small)
            ctx.fillStyle = '#558844';
            ctx.fillRect(520, 310, 3, 12);
            ctx.fillStyle = '#669955';
            ctx.beginPath(); ctx.arc(521, 306, 4, 0, Math.PI * 2); ctx.fill();

            // Scattered bones (alien animal skeleton)
            ctx.fillStyle = '#DDCCAA';
            ctx.fillRect(250, 340, 20, 3);
            ctx.fillRect(260, 335, 3, 8);
            ctx.fillRect(268, 337, 8, 2);
            // Skull
            ctx.fillRect(248, 336, 6, 6);
            ctx.fillStyle = '#221100';
            ctx.fillRect(249, 337, 2, 2);

            // Boot prints from pod to rock formation
            ctx.fillStyle = 'rgba(160,130,80,0.3)';
            ctx.fillRect(215, 310, 6, 8);
            ctx.fillRect(240, 305, 6, 8);
            ctx.fillRect(270, 310, 6, 8);
            ctx.fillRect(300, 303, 6, 8);
            ctx.fillRect(330, 308, 6, 8);
            ctx.fillRect(360, 300, 6, 8);

            // Wind-blown sand particles
            const windT = eng.animTimer / 100;
            ctx.fillStyle = 'rgba(200,170,100,0.2)';
            for (let p = 0; p < 5; p++) {
                const px = (windT * 2 + p * 130) % 660 - 10;
                const py = 260 + Math.sin(windT * 0.3 + p) * 20 + p * 20;
                ctx.fillRect(px, py, 3, 1);
            }

            // Crashed pod debris trail
            ctx.fillStyle = '#445566';
            ctx.fillRect(205, 295, 8, 4);
            ctx.fillRect(230, 300, 5, 3);
            ctx.fillRect(250, 298, 4, 3);

            // Sun lens flare effect
            ctx.fillStyle = 'rgba(255,240,200,0.04)';
            ctx.beginPath(); ctx.arc(480, 60, 60, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,240,200,0.02)';
            ctx.beginPath(); ctx.arc(480, 60, 90, 0, Math.PI * 2); ctx.fill();

            // Heat shimmer effect
            if (Math.floor(eng.animTimer / 200) % 2) {
                ctx.fillStyle = 'rgba(255,200,100,0.03)';
                ctx.fillRect(0, 180, w, 30);
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
                name: 'Crashed Pod', x: 75, y: 250, w: 145, h: 60,
                description: 'The wreckage of your escape pod.',
                look: (e) => { if (!engine.getFlag('looked_crashed_pod')) { engine.setFlag('looked_crashed_pod'); e.addScore(3); } e.showMessage('Your escape pod is totaled — half-buried in the sand and smoking. It\'s not going anywhere. You\'re stranded on this desert world.'); },
                get: (e) => e.showMessage('The pod is completely wrecked. Nothing salvageable remains.'),
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
                        e.showMessage('You start walking toward the rocks, but the twin suns are brutal. Without water or supplies, you won\'t survive the trek. You need your survival kit!');
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
            e.addForegroundLayer(320, (ctx, eng) => {
                // Center stalagmite foreground tip
                ctx.fillStyle = '#3d2e1e';
                ctx.beginPath();
                ctx.moveTo(352, 270); ctx.lineTo(347, 325); ctx.lineTo(357, 325);
                ctx.closePath(); ctx.fill();
            });

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
            // Cave background (EGA dark brown/black dithered)
            ditherRect(ctx, 0, 0, w, h, '#000000', '#AA5500', 2);

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

            // Cave paintings on left wall (alien pictographs)
            ctx.fillStyle = 'rgba(180,120,80,0.35)';
            // Stick figure hunting scene
            ctx.fillRect(30, 180, 2, 10); // body
            ctx.fillRect(25, 184, 12, 2); // arms
            ctx.fillRect(28, 190, 3, 6); // leg
            ctx.fillRect(33, 190, 3, 6); // leg
            ctx.beginPath(); ctx.arc(31, 178, 3, 0, Math.PI * 2); ctx.fill(); // head
            // Alien animal
            ctx.fillRect(50, 186, 14, 6);
            ctx.fillRect(50, 192, 2, 5);
            ctx.fillRect(62, 192, 2, 5);
            ctx.fillRect(55, 183, 3, 3); // head bump
            // Stars/suns above
            ctx.fillRect(35, 168, 3, 3);
            ctx.fillRect(55, 165, 2, 2);
            ctx.fillRect(45, 172, 2, 2);

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

            // Cave entrance (back to desert - top left)
            ctx.fillStyle = '#CC9944';
            ctx.fillRect(0, 80, 50, 110);
            ctx.fillStyle = '#DDAA55';
            ctx.fillRect(0, 90, 40, 90);
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
                    const sc = 1.85 + (py - 280) / 90 * 0.3;
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
                use: (e) => e.showMessage('You consider eating one. Then you imagine the headline: "Janitor Killed by Space Mushroom." You put it down.'),
                talk: (e) => e.showMessage('"Glow, little buddies, glow." They pulse a bit brighter. Coincidence? Probably. But you smile anyway.')
            },
            {
                name: 'Cave Paintings', x: 20, y: 160, w: 50, h: 45,
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
        name: 'Frontier Outpost',
        description: 'A ramshackle alien frontier town — Ulence Flats. Odd buildings line a dusty street. A cantina, a trading post, and a landing pad are visible.',
        onEnter: (e) => {
            e.sound.startAmbient('outpost_crowd');
            // AGS-inspired: depth scaling — outdoor town perspective
            e.setDepthScaling(265, 365, 0.7, 1.0);

            // AGI-inspired barriers: fuel barrels, street lamp
            e.addBarrier(190, 290, 45, 15);    // Fuel barrels
            e.addBarrier(396, 290, 10, 15);    // Street lamp pole base

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
                    draw: (ctx, eng, npc) => {
                        // Small alien creature wandering the street
                        const s = 1.2 + (npc.y - 280) / 120 * 0.3;
                        const bob = Math.sin(eng.animTimer / 300) * 1.5;
                        // Body (green blob)
                        ctx.fillStyle = '#44AA44';
                        ctx.beginPath();
                        ctx.ellipse(npc.x, npc.y - 8 * s + bob, 6 * s, 10 * s, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Darker belly
                        ctx.fillStyle = '#338833';
                        ctx.beginPath();
                        ctx.ellipse(npc.x, npc.y - 5 * s + bob, 4 * s, 5 * s, 0, 0, Math.PI * 2);
                        ctx.fill();
                        // Big eye
                        ctx.fillStyle = '#FFFF88';
                        ctx.beginPath();
                        ctx.arc(npc.x, npc.y - 12 * s + bob, 3 * s, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#111';
                        ctx.beginPath();
                        ctx.arc(npc.x + (npc.facing === 'left' ? -1 : 1) * s, npc.y - 12 * s + bob, 1.2 * s, 0, Math.PI * 2);
                        ctx.fill();
                        // Legs (animated)
                        ctx.fillStyle = '#44AA44';
                        const legOff = npc.cel === 0 ? 2 : -2;
                        ctx.fillRect(npc.x - 3 * s, npc.y + 1 * s, 2 * s, 4 * s + legOff);
                        ctx.fillRect(npc.x + 1 * s, npc.y + 1 * s, 2 * s, 4 * s - legOff);
                        // Feet
                        ctx.fillStyle = '#338833';
                        ctx.fillRect(npc.x - 4 * s, npc.y + 4 * s + legOff, 3 * s, 1.5 * s);
                        ctx.fillRect(npc.x + 0.5 * s, npc.y + 4 * s - legOff, 3 * s, 1.5 * s);
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
            ctx.fillStyle = '#554466';
            ctx.fillRect(30, 100, 160, 190);
            ctx.fillStyle = '#665577';
            ctx.fillRect(35, 105, 150, 145);
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
            // Sign
            ctx.fillStyle = '#CC4444';
            ctx.font = 'bold 12px "Courier New"';
            ctx.fillText('CANTINA', 55, 186);
            // Neon effect
            const neonBlink = Math.floor(eng.animTimer / 400) % 3;
            if (neonBlink !== 2) {
                ctx.fillStyle = 'rgba(255,60,60,0.15)';
                ctx.fillRect(48, 172, 95, 20);
            }

            // Building 2: Shop (center)
            ctx.fillStyle = '#556644';
            ctx.fillRect(230, 120, 150, 170);
            ctx.fillStyle = '#667755';
            ctx.fillRect(235, 125, 140, 120);
            // Window / display
            ctx.fillStyle = '#334433';
            ctx.fillRect(250, 140, 100, 50);
            // Items in display
            ctx.fillStyle = '#888899';
            ctx.fillRect(265, 170, 20, 15);
            ctx.fillStyle = '#AA8833';
            ctx.fillRect(300, 168, 15, 18);
            ctx.fillStyle = '#CC4444';
            ctx.fillRect(330, 172, 10, 12);
            // Door
            ctx.fillStyle = '#445533';
            ctx.fillRect(280, 200, 50, 90);
            // Sign
            ctx.fillStyle = '#CCCC44';
            ctx.font = 'bold 11px "Courier New"';
            ctx.fillText('TRADING POST', 242, 210);
            ctx.font = '9px "Courier New"';
            ctx.fillText('BUY • SELL • TRADE', 248, 222);

            // Landing pad (right)
            ctx.fillStyle = '#444455';
            ctx.fillRect(440, 160, 180, 130);
            ctx.fillStyle = '#555566';
            ctx.fillRect(445, 165, 170, 120);
            // Markings
            ctx.strokeStyle = '#FFFF44';
            ctx.lineWidth = 2;
            ctx.strokeRect(470, 185, 120, 80);
            ctx.beginPath();
            ctx.moveTo(530, 185); ctx.lineTo(530, 265);
            ctx.stroke();
            ctx.lineWidth = 1;
            // Ship on pad (if nav chip used)
            if (!eng.getFlag('flew_away')) {
                ctx.fillStyle = '#667788';
                ctx.beginPath();
                ctx.moveTo(490, 230); ctx.lineTo(510, 200); ctx.lineTo(560, 195);
                ctx.lineTo(575, 215); ctx.lineTo(570, 250); ctx.lineTo(490, 250);
                ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#778899';
                ctx.fillRect(515, 210, 30, 15);
                // Window
                ctx.fillStyle = '#334466';
                ctx.fillRect(525, 212, 15, 10);
            }
            // Sign
            ctx.fillStyle = '#8899AA';
            ctx.font = '10px "Courier New"';
            ctx.fillText('LANDING PAD A', 475, 178);

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

            // Wanted poster on cantina wall
            ctx.fillStyle = '#CCBB88';
            ctx.fillRect(152, 130, 22, 28);
            ctx.fillStyle = '#332222';
            ctx.font = '4px "Courier New"';
            ctx.fillText('WANTED', 154, 137);
            ctx.fillStyle = '#AA8866';
            ctx.fillRect(156, 140, 14, 12);
            ctx.fillStyle = '#332222';
            ctx.fillText('$5000', 156, 158);

            // Alien graffiti on shop wall
            ctx.fillStyle = 'rgba(200,100,200,0.3)';
            ctx.font = '8px "Courier New"';
            ctx.fillText('ZQRX WUZ HERE', 240, 260);

            // Tire tracks
            ctx.fillStyle = 'rgba(60,50,30,0.2)';
            ctx.fillRect(0, 320, w, 3);
            ctx.fillRect(0, 328, w, 2);
        },
        hotspots: [
            {
                name: 'Cantina', x: 25, y: 95, w: 170, h: 200, isExit: true, walkToX: 95, walkToY: 285,
                description: 'The local cantina. Looks lively inside.',
                look: (e) => e.showMessage('A dimly lit cantina — the social hub of this frontier outpost. Warm light spills from the windows and you can hear alien music. A neon sign flickers "CANTINA" above the door.'),
                onExit: (e) => e.goToRoom('cantina', 320, 310)
            },
            {
                name: 'Trading Post', x: 225, y: 115, w: 160, h: 180, isExit: true, walkToX: 305, walkToY: 285,
                description: 'An alien trading post.',
                look: (e) => e.showMessage('A general trading post. The display window shows various goods — weapons, ship parts, survival gear. The sign promises "BUY • SELL • TRADE". You might find something useful here.'),
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
                            e.showMessage('You\'re about to fly straight to a hostile warship. You feel like you should be better armed before leaving. Maybe the trading post has something useful...');
                            e.setFlag('shuttle_warn_ray');
                            return;
                        }
                        engine.sound.hyperspace();
                        e.showMessage('You load the nav chip into the shuttle\'s computer. Coordinates to the Draknoid flagship locked in! The engines roar to life and you blast off into space...');
                        e.setFlag('flew_away');
                        e.addScore(15);
                        e.playCutscene({
                            duration: 6000,
                            draw: cutsceneShuttleFlight,
                            onEnd: () => e.goToRoom('draknoid_ship', 100, 310),
                            skippable: true
                        });
                    } else {
                        e.showMessage('The shuttle\'s navigation computer is blank. You need coordinates — a nav chip with the destination plotted.');
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
                            e.showMessage('You\'re about to fly straight to a hostile warship. You feel like you should be better armed before leaving. Maybe the trading post has something useful...');
                            e.setFlag('shuttle_warn_ray');
                            return;
                        }
                        engine.sound.hyperspace();
                        e.showMessage('You insert the nav chip into the shuttle\'s navigation computer. Coordinates locked — destination: Draknoid Flagship! You strap in and blast off!');
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
                name: 'Wanted Poster', x: 150, y: 128, w: 26, h: 32,
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
            }
        ]
    });

    // ========== ROOM 8: CANTINA ==========
    engine.registerRoom({
        id: 'cantina',
        name: 'Cantina',
        description: 'The cantina is smoky and dim. Alien music plays from somewhere. A few patrons sit at tables. A bartender polishes glasses behind the bar.',
        onEnter: (e) => {
            e.sound.startAmbient('cantina_music');
            // AGI-inspired barriers: bar counter, tables, stools
            e.addBarrier(20, 250, 320, 20);    // Bar counter front face
            e.addBarrier(415, 280, 85, 12);    // Table 1
            e.addBarrier(525, 295, 85, 12);    // Table 2

            // Foreground layer: bar counter top draws over player walking behind
            e.addForegroundLayer(270, (ctx, eng) => {
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
            // Walls
            ctx.fillStyle = '#2a1a2a';
            ctx.fillRect(0, 0, w, h);

            // Back wall
            // Cantina walls (EGA dark red/black dithered)
            ditherRect(ctx, 0, 0, w, 250, '#000000', '#AA0000', 2);

            // Floor
            ctx.fillStyle = '#1e1018';
            ctx.fillRect(0, 250, w, 150);
            // Floor boards
            ctx.strokeStyle = '#150a12';
            for (let y = 260; y < 400; y += 20) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
            }

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

            // Table 2 (empty)
            ctx.fillStyle = '#443322';
            ctx.fillRect(530, 260, 80, 6);
            ctx.fillRect(560, 266, 6, 40);

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
                    e.setFlag('talked_bartender');
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
                                drawPlayerBody(ctx, savedPX, savedPY, 1.85, 0);
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
                    const sc = 1.85 + (py - 280) / 90 * 0.3;
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
        name: 'Trading Post',
        description: 'The interior of the trading post. An alien merchant stands behind a counter displaying various goods — weapons, tools, and curiosities from across the galaxy.',
        onEnter: (e) => {
            e.sound.startAmbient('outpost_crowd');
            // AGI-inspired barriers: shop counter
            e.addBarrier(40, 255, 420, 15);    // Counter front edge

            // Foreground layer: counter top draws over player
            e.addForegroundLayer(265, (ctx, eng) => {
                ctx.fillStyle = '#665533';
                ctx.fillRect(48, 255, 405, 3); // Counter front lip
            });

            // Edge transition: left exits to outpost
            e.setEdgeTransition('left', (eng) => {
                eng.goToRoom('outpost', 305, 310);
            });
        },
        draw: (ctx, w, h, eng) => {
            // Walls
            ctx.fillStyle = '#2a2a1a';
            ctx.fillRect(0, 0, w, h);
            // Shop walls (EGA dark brown dithered)
            ditherRect(ctx, 0, 0, w, 260, '#000000', '#AA5500', 2);

            // Floor
            ctx.fillStyle = '#22201a';
            ctx.fillRect(0, 260, w, 140);
            ctx.strokeStyle = '#1a1812';
            for (let y = 270; y < 400; y += 18) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
            }

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

    // ========== ROOM 10: DRAKNOID SHIP ==========
    engine.registerRoom({
        id: 'draknoid_ship',
        name: 'Draknoid Flagship',
        description: 'You\'ve infiltrated the Draknoid flagship. A massive chamber houses the stolen Quantum Drive prototype, protected by a shimmering force field. A Draknoid guard stands watch.',
        onEnter: (e) => {
            e.sound.startAmbient('draknoid_ship');
            // AGI-inspired barriers: central platform, guard (when alive)
            e.addBarrier(240, 280, 160, 10);   // Central platform base
            if (!e.getFlag('guard_defeated')) {
                e.addBarrier(90, 280, 70, 15); // Guard body blocks passage
            }

            // Foreground layer: platform surface draws over player walking behind
            e.addForegroundLayer(285, (ctx, eng) => {
                ctx.fillStyle = '#1a3a1a';
                ctx.fillRect(248, 280, 145, 3);
            });

            // Edge transitions — ship is a dead end, only airlock exit to the left
            e.setEdgeTransition('right', (eng) => {
                eng.showMessage('The corridor leads deeper into the ship — swarming with Draknoids. Going that way alone would be suicide.');
            });
        },
        onUpdate: (e) => {
            // Set guard_anim_done flag once the 7.5s defeat animation finishes
            const shootStart = e.getFlag('guard_shoot_start');
            if (shootStart && !e.getFlag('guard_anim_done') && e.animTimer - shootStart >= 7500) {
                e.setFlag('guard_anim_done');
                e.showMessage('The guard collapses in a heap of sparking armor. The path to the console is clear!');
            }
        },
        draw: (ctx, w, h, eng) => {
            // Dark alien ship interior
            // Draknoid ship interior (EGA dark green dithered)
            ditherRect(ctx, 0, 0, w, h, '#000000', '#00AA00', 2);

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

            // Floor
            ctx.fillStyle = '#0e1a0e';
            ctx.fillRect(0, 280, w, 120);
            // Floor pattern
            ctx.strokeStyle = '#162216';
            for (let x = 0; x < w; x += 50) {
                ctx.beginPath(); ctx.moveTo(x, 280); ctx.lineTo(x, 400); ctx.stroke();
            }
            for (let y = 280; y < 400; y += 30) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
            }

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
            ctx.fillStyle = '#1a2e1a';
            ctx.fillRect(240, 250, 160, 30);
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
            ctx.font = '8px "Courier New"';
            ctx.fillText('QD PROTO', 292, 230);
            ctx.fillText('v3.1', 303, 240);

            // Force field
            if (!eng.getFlag('field_down')) {
                const ffAlpha = 0.2 + Math.sin(eng.animTimer / 400) * 0.1;
                ctx.fillStyle = `rgba(50,255,50,${ffAlpha})`;
                ctx.fillRect(260, 100, 120, 180);
                // Field lines
                ctx.strokeStyle = `rgba(100,255,100,${ffAlpha + 0.1})`;
                ctx.lineWidth = 1;
                for (let fy = 105; fy < 280; fy += 15) {
                    ctx.beginPath();
                    ctx.moveTo(260, fy);
                    ctx.lineTo(380, fy);
                    ctx.stroke();
                }
                // Field generators
                ctx.fillStyle = '#338833';
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
                    drawSpeechBubble(ctx, 210, 110, "'TIS BUT A SCRATCH!");
                }
                if (guardT >= SPEECH2_START && guardT < SPEECH2_END) {
                    drawSpeechBubble(ctx, 210, 110, "MERELY A FLESH WOUND!");
                }

                // "COME BACK HERE!" as guard falls
                if (guardT >= FALL_START && guardT < FALL_END) {
                    const fallP = (guardT - FALL_START) / (FALL_END - FALL_START);
                    if (fallP < 0.5) {
                        drawSpeechBubble(ctx, 200, 100 + fallP * 40, "I'LL BITE YOUR LEGS OFF!");
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
        },
        hotspots: [
            {
                name: 'Draknoid Guard', x: 78, y: 115, w: 90, h: 180,
                description: 'A heavily armored Draknoid guard.',
                look: (e) => {
                    if (e.getFlag('guard_defeated')) {
                        e.showMessage('The Draknoid guard lies in several pieces on the floor. His arms are... elsewhere. Apparently Draknoid warriors aren\'t built as tough as they look.');
                    } else {
                        e.showMessage('A massive Draknoid warrior in full battle armor. Red visor glowing menacingly. He\'s armed with a heavy plasma rifle and stands between you and the Quantum Drive. You\'ll need a weapon to deal with him.');
                    }
                },
                walk: (e) => {
                    if (e.getFlag('guard_defeated')) {
                        e.showMessage('You step over the smouldering remains of the guard. Best not to look too closely.');
                    } else {
                        e.die('You try to sneak past the Draknoid guard. Bad idea. He spots you instantly and opens fire with his plasma rifle. You should have found a weapon first.');
                    }
                },
                talk: (e) => {
                    if (e.getFlag('guard_defeated')) {
                        e.showMessage('His torso is over there, his arms are over HERE... this conversation is going nowhere.');
                    } else {
                        e.showMessage('"HALT! INTRUDER! ONE MORE STEP AND I\'LL VAPORIZE YOU!" The guard raises his plasma rifle menacingly. You should probably deal with him from a safe distance... with a weapon.');
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
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('You can\'t get a good look with that guard pointing a gun at you.');
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('The console shows "FORCE FIELD OFFLINE". The data cartridge is still plugged in.');
                    } else {
                        e.showMessage('A Draknoid computer console. The screen says "FORCE FIELD: ACTIVE" and there\'s a data port labeled "READY". If you had the right data, you might be able to override the force field.');
                    }
                },
                use: (e) => {
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('Deal with the guard first!');
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('The force field is already down.');
                    } else if (e.hasItem('cartridge')) {
                        e.showMessage('You insert the Quantum Drive data cartridge into the console. The system recognizes the technical specs and initiates an override... The force field SHIMMERS and DROPS! The Quantum Drive is exposed!');
                        e.removeFromInventory('cartridge');
                        e.setFlag('field_down');
                        e.addScore(25);
                    } else {
                        e.showMessage('The console has a data port but you need the right data to interface with it.');
                    }
                },
                useItem: (e, itemId) => {
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('The guard won\'t let you near the console!');
                    } else if (itemId === 'cartridge' && !e.getFlag('field_down')) {
                        e.showMessage('You slot the data cartridge into the console. The Draknoid system reads the Quantum Drive specs and, thinking it\'s an authorized maintenance override, disables the force field! Brilliant!');
                        e.removeFromInventory('cartridge');
                        e.setFlag('field_down');
                        e.addScore(25);
                    } else if (e.getFlag('field_down')) {
                        e.showMessage('Force field is already offline.');
                    } else {
                        e.showMessage('The console doesn\'t accept that.');
                    }
                }
            },
            {
                name: 'Quantum Drive', x: 275, y: 150, w: 90, h: 110,
                description: 'The stolen Quantum Drive prototype!',
                look: (e) => {
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('Through the force field shimmer, you can see the Quantum Drive prototype. Its core pulses with incredible energy. This is what they stole from the Constellation. But first — that guard.');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('The Quantum Drive sits tantalizingly close, but the force field blocks you. You need to find a way to shut it down — the console on the right might help.');
                    } else {
                        e.showMessage('The Quantum Drive prototype sits unprotected! Its core glows with mesmerizing blue energy. This is it — grab it and save the galaxy!');
                    }
                },
                get: (e) => {
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('You can\'t get past the guard, let alone the force field!');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('ZAP! The force field shocks you as you reach for it. You need to disable the field first!');
                    } else if (!e.getFlag('grabbed_quantum_drive')) {
                        // VICTORY!
                        e.setFlag('grabbed_quantum_drive');
                        e.addScore(20);
                        const victoryMsg = 'You grab the Quantum Drive and run for the airlock! Behind you, alarms blare as the Draknoids realize what\'s happened. You sprint through the corridors, leap into your shuttle, and blast away just as the flagship turns to pursue. But it\'s too late — you jump to hyperspace with the Quantum Drive safely aboard. From humble janitor to galactic hero... the galaxy owes its future to one unlikely sanitation engineer. THE END.';
                        e.playCutscene({
                            duration: 8000,
                            draw: cutsceneVictoryEscape,
                            onEnd: () => e.victory(victoryMsg),
                            skippable: true
                        });
                    }
                },
                use: (e) => {
                    if (!e.getFlag('guard_anim_done')) {
                        e.showMessage('You can\'t get past the guard!');
                    } else if (!e.getFlag('field_down')) {
                        e.showMessage('ZAP! The force field blocks you!');
                    } else if (!e.getFlag('grabbed_quantum_drive')) {
                        e.setFlag('grabbed_quantum_drive');
                        e.addScore(20);
                        const victoryMsg = 'You grab the Quantum Drive and run for the airlock! Behind you, alarms blare as the Draknoids realize what\'s happened. You sprint through the corridors, leap into your shuttle, and blast away just as the flagship turns to pursue. But it\'s too late — you jump to hyperspace with the Quantum Drive safely aboard. From humble janitor to galactic hero... the galaxy owes its future to one unlikely sanitation engineer. THE END.';
                        e.playCutscene({
                            duration: 8000,
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
                    e.showMessage('A powerful energy force field surrounds the Quantum Drive platform. It hums with lethal voltage. You\'ll need to find a way to shut it off — brute force won\'t work.');
                },
                use: (e) => {
                    if (!e.getFlag('field_down')) {
                        const px = engine.playerX, py = engine.playerY;
                        const sc = 1.85 + (py - 280) / 90 * 0.3;
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
            }
        ]
    });

    // ========== START THE GAME ==========
    engine.start();
});
