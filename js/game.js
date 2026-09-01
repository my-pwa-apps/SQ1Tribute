// ============================================================
// STAR SWEEPER - GAME CONTENT
// All rooms, items, puzzles, and artwork
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const STAR_SWEEPER_GAME = StarSweeperContent.game;

    const engine = new GameEngine(STAR_SWEEPER_GAME);
    window.engine = engine;
    const PAL = window.SS_PALETTE;

    // ========== ITEMS ==========
    StarSweeperContent.items.forEach(item => engine.registerItem({ ...item }));

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

    // Korvak the engineer — wounded, trapped in engine room
    engine.registerDialog({
        id: 'korvak',
        startTopic: 'greeting',
        topics: [
            {
                id: 'greeting',
                text: '"*cough* ... Someone\'s there? Oh thank the stars. I\'m Korvak — chief engineer. My leg\'s pinned. I\'ve been here since the attack."',
                options: [
                    {
                        text: 'What happened?',
                        response: '"Draknoids hit the ship with a tri-pulse EMP, then boarded. They were after something specific — heard them shouting about "the drive". The explosion in the reactor bay trapped me here. Most of the crew... they didn\'t make it."',
                        once: true
                    },
                    {
                        text: 'Are there any survivors?',
                        response: '"I heard voices in the pod bay — maybe some made it out. One of their boarding tablets was logging prisoners as they dragged crewmates toward the shuttle. They took some of us alive. If that list reached their ship, there may still be time."',
                        once: true
                    },
                    {
                        text: 'I need to get to the escape pods.',
                        response: '"Right, of course. Here — take my plasma cutter. It\'s fine tool, cut through any jammed door or panel. Even field emitters, in a pinch. Promise me you\'ll try to find the others?"',
                        condition: (eng) => !eng.getFlag('korvak_gave_cutter'),
                        action: (eng) => {
                            eng.addToInventory('plasma_cutter');
                            eng.setFlag('korvak_gave_cutter');
                            eng.addScore(15);
                            eng.updateInventoryUI();
                        },
                        once: true
                    },
                    {
                        text: 'Let me take a look at that leg.',
                        response: '"It\'s not pretty. I could survive if I had a medkit — there should be one in the fire suppression cabinet on the left wall, right here in this room. Emergency pods carry another in their crash lockers, but that won\'t help me once you launch. I\'d get this one myself but... well."',
                        once: true
                    },
                    {
                        text: 'I found a medkit.',
                        response: '"You beautiful, beautiful janitor. Hand it over... ah. That\'s better. I can get myself out now. I\'ll try to make for the life rafts on deck two. Go — I\'ll slow you down. And Wilkins? Don\'t let those reptiles win."',
                        condition: (eng) => eng.hasItem('medkit') && !eng.getFlag('korvak_healed'),
                        action: (eng) => {
                            eng.removeFromInventory('medkit');
                            eng.setFlag('korvak_healed');
                            eng.setFlag('korvak_freed');
                            eng.setFlag('korvak_left');
                            eng.addScore(20);
                            eng.updateInventoryUI();
                        },
                        once: true,
                        endDialog: true
                    },
                    {
                        text: 'I have to go. Hang tight.',
                        response: '"Go. Save yourself. And maybe everyone else. No pressure."',
                        endDialog: true
                    }
                ]
            }
        ]
    });

    // Pipz the stowaway kid — wrecked freighter on Kerona
    engine.registerDialog({
        id: 'pipz',
        startTopic: 'greeting',
        topics: [
            {
                id: 'greeting',
                text: '"Don\'t come any closer! I have a... a spanner. A quite large spanner."',
                options: [
                    {
                        text: 'I\'m not going to hurt you.',
                        response: '"...You\'re not Draknoid. You\'re a smoothskin like me! Oh thank goodness. I\'m Pipz. This is — was — my family\'s freighter. We were making a delivery run when the Draknoids jumped us."',
                        once: true
                    },
                    {
                        text: 'What happened to your family?',
                        response: '"Dad managed to get me into the emergency hatch before they boarded. I saw them take him and mum on their ship. They said something about a... brig. A detention cell. They might still be alive!"',
                        once: true
                    },
                    {
                        text: 'Is there anything useful on this freighter?',
                        response: '"The cargo hold is mostly torched, but I\'ve been living up here near the bridge. Dad always kept a frequency chip in the emergency locker — still works. The blast knocked the cargo manifest out by the hull breach. Oh, and I found this prisoner badge near the hatch..."',
                        action: (eng) => {
                            if (!eng.getFlag('pipz_gave_items')) {
                                eng.setFlag('pipz_gave_items');
                                eng.addToInventory('prisoner_badge');
                                eng.addToInventory('frequency_chip');
                                eng.addScore(15);
                                eng.updateInventoryUI();
                            }
                        },
                        once: true
                    },
                    {
                        text: 'I\'m heading to the Draknoid ship.',
                        response: '"PLEASE — if you find my parents, bring them home. Their names are Jorv and Mella Vance. Please. I\'ll wait here." Her eyes are huge. You really can\'t say no to that.',
                        once: true
                    },
                    {
                        text: 'Your parents are safe.',
                        response: '"They\'re... they\'re ALIVE?! Oh stars, oh stars!" She bursts into tears. Happy ones. "Thank you. THANK YOU. I\'ll tell everyone what you did. You\'re a hero!" Somewhat embarrassingly, she hugs your leg.',
                        condition: (eng) => eng.getFlag('rescued_prisoners'),
                        action: (eng) => {
                            if (!eng.getFlag('pipz_thanked')) {
                                eng.setFlag('pipz_thanked');
                            }
                        },
                        once: true,
                        endDialog: true
                    },
                    {
                        text: 'I have to go. Stay hidden.',
                        response: '"I will. I\'ve been hiding for seventeen hours. I\'m basically a professional by now."',
                        endDialog: true
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
            engine.announce(lines.join(' '));
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
            engine.sound.playerMotif();
            engine.goToRoom('broom_closet', 320, 310);
        }

        // Draw the real broom closet room
        function drawRoom(ctx, w, h, alpha) {
            if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
            const room = engine.rooms['broom_closet'];
            if (room && room.draw) room.draw(ctx, w, h, engine);
            ctx.globalAlpha = 1;
        }

        // Ship alert readouts are screen overlays: they get their own backing
        // plate for legibility and must not ride the screen shake.
        function drawAlertPanel(ctx, w, headline, headlineBright, lines) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const lineH = 15;
            const boxW = 380;
            const boxH = 30 + lines.length * lineH + 10;
            const bx = Math.round((w - boxW) / 2), by = 24;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(bx, by, boxW, boxH);
            ctx.strokeStyle = '#AA0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx + 2, by + 2, boxW - 4, boxH - 4);
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Courier New"';
            ctx.fillStyle = headlineBright ? '#FF5555' : '#CC3333';
            ctx.fillText(headline, w / 2, by + 21);
            ctx.font = '10px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            lines.forEach((line, i) => ctx.fillText(line, w / 2, by + 38 + i * lineH));
            ctx.textAlign = 'left';
            ctx.restore();
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
            ctx.fillStyle = '#000000';
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4);
            ctx.strokeStyle = '#AA0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX + 7, boxY + 7, boxW - 14, boxH - 14);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);
            // Text lines
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 11px "Courier New"';
            ctx.textAlign = 'center';
            lines.forEach((line, i) => {
                ctx.fillText(line, w / 2, boxY + padY + 11 + i * lh);
            });
            // Blinking continue indicator
            const blink = Math.floor(Date.now() / 500) % 2;
            if (blink) {
                ctx.fillStyle = '#000000';
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
                // Fast-forward only to the next authored beat. The old broad skip
                // jumped from the first warning directly to gameplay, bypassing the
                // attack explosions, screen shake and emergency readout whenever a
                // player pressed Space while following the advance prompt.
                const nextBeat = [
                    4201,
                    2001,
                    narrationSeen.has('p2_yawn') ? 2201 : 601,
                    1801,
                    narrationSeen.has('p4_shudder') ? 1601 : 601,
                    601
                ][introPhase];
                if (nextBeat !== undefined) {
                    phaseStartTime = elapsed - pauseAccum - nextBeat;
                    return;
                }
                if (introPhase === 6) endIntro();
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
                    ctx.fillStyle = `rgba(85,255,85,${fade})`;
                    ctx.fillText('ISS CONSTELLATION', w / 2, 70);
                    ctx.fillText('DEEP SPACE SURVEY VESSEL', w / 2, 88);
                    ctx.font = '10px "Courier New"';
                    ctx.fillStyle = `rgba(85,255,85,${fade * 0.9})`;
                    ctx.fillText('CREW: 147  |  MISSION DAY: 2,847', w / 2, 120);
                    ctx.fillText('SECTOR: GAMMA QUADRANT, UNCHARTED ZONE', w / 2, 140);
                    if (t > 1800) {
                        const f2 = Math.min((t - 1800) / 1200, 1);
                        ctx.fillStyle = `rgba(210,210,210,${f2})`;
                        ctx.fillText('SHIP STATUS: ALL SYSTEMS NOMINAL', w / 2, 180);
                        ctx.fillText('TIME: 03:47 SHIP STANDARD', w / 2, 200);
                    }
                    if (t > 3200) {
                        const f3 = Math.min((t - 3200) / 800, 1);
                        ctx.fillStyle = `rgba(210,210,210,${f3})`;
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
                    drawPlayerSleeping(ctx, 258, 322 + breathe, 0);
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
                        // eyeOpen: starts fully closed, begins opening past standProg 0.2
                        const eyeOpen = standProg > 0.2 ? (standProg - 0.2) / 0.2 : 0;
                        drawPlayerSleeping(ctx, 258, 322 + breathe, eyeOpen);
                    } else if (standProg < 0.7) {
                        // Sit-up phase: matches the shared ego scale
                        const s = engine.playerSpriteScale(310);
                        const sitP = (standProg - 0.4) / 0.3;
                        const cpx = 300;                          // horizontal centre
                        const tY = 310 + 6 * s - sitP * 18 * s;  // torso bottom (belt level), rising
                        const hY = tY - 18 * s;                   // head top
                        // Boots
                        ctx.fillStyle = PLAYER_PALETTE.boots;
                        ctx.fillRect(cpx - 5 * s, tY + 9 * s, 4 * s, 3 * s);
                        ctx.fillRect(cpx + 0 * s, tY + 9 * s, 4 * s, 3 * s);
                        ctx.fillStyle = '#111111';
                        ctx.fillRect(cpx - 5 * s, tY + 11 * s, 5 * s, 1 * s);
                        ctx.fillRect(cpx + 0 * s, tY + 11 * s, 5 * s, 1 * s);
                        // Legs
                        ctx.fillStyle = PLAYER_PALETTE.legs;
                        ctx.fillRect(cpx - 4 * s, tY + 1 * s, 3 * s, 8 * s);
                        ctx.fillRect(cpx + 1 * s, tY + 1 * s, 3 * s, 8 * s);
                        ctx.fillStyle = PLAYER_PALETTE.legHighlight;
                        ctx.fillRect(cpx - 3 * s, tY + 2 * s, 1 * s, 6 * s);
                        ctx.fillRect(cpx + 2 * s, tY + 2 * s, 1 * s, 6 * s);
                        // Body
                        ctx.fillStyle = PLAYER_PALETTE.suit;
                        ctx.fillRect(cpx - 5 * s, tY - 10 * s, 10 * s, 11 * s);
                        ctx.fillStyle = PLAYER_PALETTE.suitShadow;
                        ctx.fillRect(cpx - 5 * s, tY - 10 * s, 1 * s, 11 * s);
                        ctx.fillRect(cpx + 4 * s, tY - 10 * s, 1 * s, 11 * s);
                        ctx.fillStyle = PLAYER_PALETTE.legHighlight;
                        ctx.fillRect(cpx - 1 * s, tY - 6 * s, 2 * s, 4 * s);
                        // Collar
                        ctx.fillStyle = PLAYER_PALETTE.collar;
                        ctx.fillRect(cpx - 4 * s, tY - 10 * s, 8 * s, 1 * s);
                        // Belt
                        ctx.fillStyle = PLAYER_PALETTE.belt;
                        ctx.fillRect(cpx - 5 * s, tY, 10 * s, 2 * s);
                        // Belt buckle
                        ctx.fillStyle = PLAYER_PALETTE.buckle;
                        ctx.fillRect(cpx - 1.5 * s, tY - 0.5 * s, 3 * s, 2.5 * s);
                        // Arms braced at the shoulder; the elbow angles out while he pushes up.
                        const brace = Math.round((1 - sitP) * 2 * s);
                        ctx.fillStyle = PLAYER_PALETTE.suit;
                        ctx.fillRect(cpx - 7 * s, tY - 8 * s, 2 * s, 4 * s);
                        ctx.fillRect(cpx + 5 * s, tY - 8 * s, 2 * s, 4 * s);
                        ctx.fillRect(cpx - 7 * s - brace, tY - 4.5 * s, 2 * s, 3 * s);
                        ctx.fillRect(cpx + 5 * s + brace, tY - 4.5 * s, 2 * s, 3 * s);
                        ctx.fillStyle = PLAYER_PALETTE.collar;
                        ctx.fillRect(cpx - 7 * s - brace, tY - 2 * s, 2 * s, 1 * s);
                        ctx.fillRect(cpx + 5 * s + brace, tY - 2 * s, 2 * s, 1 * s);
                        // Hands
                        ctx.fillStyle = PLAYER_PALETTE.skin;
                        ctx.fillRect(cpx - 7 * s - brace, tY - 1 * s, 2 * s, 2.5 * s);
                        ctx.fillRect(cpx + 5 * s + brace, tY - 1 * s, 2 * s, 2.5 * s);
                        // Hair
                        ctx.fillStyle = PLAYER_PALETTE.hair;
                        ctx.fillRect(cpx - 4 * s, hY - 1 * s, 8 * s, 4 * s);
                        ctx.fillStyle = '#CC8844';
                        ctx.fillRect(cpx - 2 * s, hY - 1 * s, 4 * s, 1 * s);
                        // Head
                        ctx.fillStyle = PLAYER_PALETTE.skin;
                        ctx.fillRect(cpx - 4 * s, hY, 8 * s, 8 * s);
                        ctx.fillStyle = PLAYER_PALETTE.skinShadow;
                        ctx.fillRect(cpx - 4 * s, hY + 7 * s, 8 * s, 1 * s);
                        // Eyes
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(cpx - 3 * s, hY + 3 * s, 2.5 * s, 2 * s);
                        ctx.fillRect(cpx + 0.5 * s, hY + 3 * s, 2.5 * s, 2 * s);
                        ctx.fillStyle = PLAYER_PALETTE.iris;
                        ctx.fillRect(cpx - 2.5 * s, hY + 3 * s, 1.5 * s, 2 * s);
                        ctx.fillRect(cpx + 1 * s, hY + 3 * s, 1.5 * s, 2 * s);
                    } else {
                        drawPlayerBody(ctx, px, baseY, engine.playerSpriteScale(baseY), wakeProg > 0.85 ? 0 : 0.5);
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
                    drawPlayerBody(ctx, 300, 310, engine.playerSpriteScale(310), 0);
                    const warn = Math.floor(elapsed / 250) % 2;
                    drawAlertPanel(ctx, w, '!! WARNING - PROXIMITY ALERT !!', warn, [
                        'UNIDENTIFIED VESSEL DETECTED',
                        'CLASSIFICATION: HOSTILE'
                    ]);
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
                    drawPlayerBody(ctx, 300 + stumble, 310 + stumbleY, engine.playerSpriteScale(310 + stumbleY), Math.sin(elapsed / 200) * 0.5 + 0.5);
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
                    drawPlayerBody(ctx, 300, 310, engine.playerSpriteScale(310), 0);
                    drawAlertPanel(ctx, w, '!! EMERGENCY - ALL HANDS !!', Math.floor(elapsed / 300) % 2, [
                        'HULL BREACH ON DECKS 3-5',
                        'LIFE SUPPORT SYSTEMS FAILING',
                        'EVACUATION PROTOCOL INITIATED'
                    ]);
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

    function metalFloor(ctx, y, w, h, color1, color2) {
        ditherRect(ctx, 0, y, w, h, color1 || PAL.FLOOR_LIGHT, color2 || PAL.FLOOR_DARK, 2);
        ctx.strokeStyle = PAL.OUTLINE;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
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

    function drawPlayerBody(ctx, px, py, s, armAngle) {
        // Front-facing player for mini-anims. Shading mirrors the in-room sprite
        // in engine.drawPlayer so the character does not change between them.
        // Legs
        ctx.fillStyle = PLAYER_PALETTE.legs;
        ctx.fillRect(px - 4 * s, py + 1 * s, 3 * s, 8 * s);
        ctx.fillRect(px + 1 * s, py + 1 * s, 3 * s, 8 * s);
        ctx.fillStyle = PLAYER_PALETTE.legHighlight;
        ctx.fillRect(px - 3 * s, py + 2 * s, 1 * s, 6 * s);
        ctx.fillRect(px + 2 * s, py + 2 * s, 1 * s, 6 * s);
        // Boots
        ctx.fillStyle = PLAYER_PALETTE.boots;
        ctx.fillRect(px - 5 * s, py + 9 * s, 4 * s, 3 * s);
        ctx.fillRect(px + 0 * s, py + 9 * s, 4 * s, 3 * s);
        ctx.fillStyle = '#111111';
        ctx.fillRect(px - 5 * s, py + 11 * s, 5 * s, 1 * s);
        ctx.fillRect(px + 0 * s, py + 11 * s, 5 * s, 1 * s);
        ctx.fillStyle = PLAYER_PALETTE.bootHighlight;
        ctx.fillRect(px - 4 * s, py + 9 * s, 2 * s, 1 * s);
        ctx.fillRect(px + 1 * s, py + 9 * s, 2 * s, 1 * s);
        // Body
        ctx.fillStyle = PLAYER_PALETTE.suit;
        ctx.fillRect(px - 5 * s, py - 10 * s, 10 * s, 11 * s);
        ctx.fillStyle = PLAYER_PALETTE.suitShadow;
        ctx.fillRect(px - 5 * s, py - 10 * s, 1 * s, 11 * s);
        ctx.fillRect(px + 4 * s, py - 10 * s, 1 * s, 11 * s);
        ctx.fillStyle = PLAYER_PALETTE.legHighlight;
        ctx.fillRect(px - 1 * s, py - 6 * s, 2 * s, 4 * s);
        // Collar
        ctx.fillStyle = PLAYER_PALETTE.collar;
        ctx.fillRect(px - 4 * s, py - 10 * s, 8 * s, 1 * s);
        // Belt
        ctx.fillStyle = PLAYER_PALETTE.belt;
        ctx.fillRect(px - 5 * s, py, 10 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.buckle;
        ctx.fillRect(px - 1.5 * s, py - 0.5 * s, 3 * s, 2.5 * s);
        // Janitorial identity details shared with the in-room ego sprite.
        ctx.fillStyle = PLAYER_PALETTE.toolPouch;
        ctx.fillRect(px - 6 * s, py - 0.5 * s, 2 * s, 3 * s);
        ctx.fillStyle = PLAYER_PALETTE.cleaningRag;
        ctx.fillRect(px + 4 * s, py, 2 * s, 2.5 * s);
        ctx.fillStyle = PLAYER_PALETTE.workPatch;
        ctx.fillRect(px + 1.5 * s, py - 8 * s, 2.5 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.workPatchDark;
        ctx.fillRect(px + 2.5 * s, py - 7.5 * s, 1 * s, 1 * s);
        // Friendly stepped face and jaw, matching the gameplay sprite.
        ctx.fillStyle = PLAYER_PALETTE.skin;
        ctx.fillRect(px - 3 * s, py - 18 * s, 6 * s, 1 * s);
        ctx.fillRect(px - 4 * s, py - 17 * s, 8 * s, 5 * s);
        ctx.fillRect(px - 3 * s, py - 12 * s, 6 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.skinShadow;
        ctx.fillRect(px - 3 * s, py - 11 * s, 6 * s, 1 * s);
        // Tousled hair and cowlick.
        ctx.fillStyle = PLAYER_PALETTE.hair;
        ctx.fillRect(px - 3 * s, py - 20 * s, 2 * s, 2 * s);
        ctx.fillRect(px - 4 * s, py - 19 * s, 7 * s, 3 * s);
        ctx.fillRect(px + 3 * s, py - 18 * s, 1 * s, 3 * s);
        ctx.fillStyle = PLAYER_PALETTE.hairDark;
        ctx.fillRect(px - 4 * s, py - 18 * s, 1 * s, 3 * s);
        ctx.fillStyle = PLAYER_PALETTE.hairHighlight;
        ctx.fillRect(px - 1 * s, py - 20 * s, 3 * s, 1 * s);
        ctx.fillStyle = PLAYER_PALETTE.brow;
        ctx.fillRect(px - 3 * s, py - 16 * s, 2 * s, 0.5 * s);
        ctx.fillRect(px + 1 * s, py - 16 * s, 2 * s, 0.5 * s);
        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(px - 3 * s, py - 15 * s, 2.5 * s, 2 * s);
        ctx.fillRect(px + 0.5 * s, py - 15 * s, 2.5 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.iris;
        ctx.fillRect(px - 2.5 * s, py - 15 * s, 1.5 * s, 2 * s);
        ctx.fillRect(px + 1 * s, py - 15 * s, 1.5 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.skinShadow;
        ctx.fillRect(px - 0.5 * s, py - 14 * s, 1 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.smile;
        ctx.fillRect(px - 1.5 * s, py - 11.5 * s, 3 * s, 0.5 * s);
        ctx.fillRect(px + 1 * s, py - 12 * s, 1 * s, 0.5 * s);
        // Arms pivot at the shoulder in three discrete poses (Sierra used cels,
        // not tweens) so the limb never slides up the torso past the shoulder.
        const armPose = armAngle < 0.25 ? 0 : (armAngle < 0.7 ? 1 : 2);
        const drawArm = (sx, out) => {
            ctx.fillStyle = PLAYER_PALETTE.suit;
            if (armPose === 0) {
                ctx.fillRect(sx, py - 8 * s, 2 * s, 6 * s);
                ctx.fillStyle = PLAYER_PALETTE.collar;
                ctx.fillRect(sx, py - 2 * s, 2 * s, 1 * s);
                ctx.fillStyle = PLAYER_PALETTE.gloves;
                ctx.fillRect(sx, py - 1 * s, 2 * s, 2.5 * s);
            } else if (armPose === 1) {
                // Slight outward bend at the elbow — not a full splay.
                ctx.fillRect(sx, py - 8 * s, 2 * s, 4 * s);
                ctx.fillRect(sx + out * 1 * s, py - 4.5 * s, 2 * s, 3 * s);
                ctx.fillStyle = PLAYER_PALETTE.gloves;
                ctx.fillRect(sx + out * 2 * s, py - 2 * s, 2 * s, 2.5 * s);
            } else {
                ctx.fillRect(sx, py - 8 * s, 2 * s, 2 * s);
                ctx.fillRect(out < 0 ? sx - 4 * s : sx + 2 * s, py - 8 * s, 4 * s, 2 * s);
                ctx.fillStyle = PLAYER_PALETTE.gloves;
                ctx.fillRect(out < 0 ? sx - 6 * s : sx + 6 * s, py - 8 * s, 2 * s, 2.5 * s);
            }
        };
        drawArm(px - 7 * s, -1);
        drawArm(px + 5 * s, 1);
    }

    /**
     * Draw the player lying down (sleeping / waking).
     * bx = left edge of head, cy = vertical CENTRE of the lying body.
     * All sizes derived from drawPlayerBody at the shared ego scale (body rotated 90°).
     * eyeOpen: 0 = closed, 1 = fully open.
     */
    function drawPlayerSleeping(ctx, bx, cy, eyeOpen) {
        const s = engine.playerSpriteScale(310);
        // Horizontal reference points (head left → feet right)
        const bodyX = bx + 8 * s;          // torso starts just right of head
        const beltX = bodyX + 11 * s;      // belt column
        const legX  = beltX + 2 * s;       // legs start right of belt
        const bootX = legX  + 8 * s;       // boots start right of legs

        // ---- BACK ARM (rendered first so it sits behind the body) ----
        ctx.fillStyle = PLAYER_PALETTE.suitShadow;
        ctx.fillRect(bodyX + 1 * s, cy + 3.5 * s, 8 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.skinShadow;
        ctx.fillRect(bodyX + 8.5 * s, cy + 3.5 * s, 2.5 * s, 2 * s);

        // ---- BOOTS ----
        ctx.fillStyle = PLAYER_PALETTE.boots;
        ctx.fillRect(bootX, cy - 2 * s, 4 * s, 2 * s);   // near boot
        ctx.fillRect(bootX, cy + 1 * s, 4 * s, 2 * s);   // far boot (offset)

        // ---- LEGS ----
        ctx.fillStyle = PLAYER_PALETTE.legs;
        ctx.fillRect(legX, cy - 4 * s, 8 * s, 3 * s);    // near leg
        ctx.fillRect(legX, cy + 1 * s, 8 * s, 3 * s);    // far leg

        // ---- BODY ----
        ctx.fillStyle = PLAYER_PALETTE.suit;
        ctx.fillRect(bodyX, cy - 5 * s, 11 * s, 10 * s);

        // Collar strip at neck end of body
        ctx.fillStyle = PLAYER_PALETTE.collar;
        ctx.fillRect(bodyX, cy - 4 * s, 2 * s, 8 * s);

        // Belt (runs vertically across body when lying)
        ctx.fillStyle = PLAYER_PALETTE.belt;
        ctx.fillRect(beltX - 1 * s, cy - 5 * s, 2 * s, 10 * s);
        // Belt buckle
        ctx.fillStyle = PLAYER_PALETTE.buckle;
        ctx.fillRect(beltX - 1.5 * s, cy - 1.5 * s, 3 * s, 3 * s);
        ctx.fillStyle = PLAYER_PALETTE.toolPouch;
        ctx.fillRect(beltX - 1 * s, cy - 6 * s, 3 * s, 2 * s);
        ctx.fillStyle = PLAYER_PALETTE.cleaningRag;
        ctx.fillRect(beltX, cy + 4 * s, 2.5 * s, 2 * s);

        // Cyan maintenance patch on the sleeping uniform.
        ctx.fillStyle = PLAYER_PALETTE.workPatch;
        ctx.fillRect(bodyX + 3 * s, cy - 5 * s, 2 * s, 2.5 * s);
        ctx.fillStyle = PLAYER_PALETTE.workPatchDark;
        ctx.fillRect(bodyX + 3.5 * s, cy - 4 * s, 1 * s, 1 * s);

        // ---- FRONT ARM (resting above body surface) ----
        ctx.fillStyle = PLAYER_PALETTE.suit;
        ctx.fillRect(bodyX + 1 * s, cy - 7.5 * s, 8 * s, 2 * s);
        // Hand
        ctx.fillStyle = PLAYER_PALETTE.skin;
        ctx.fillRect(bodyX + 8.5 * s, cy - 7.5 * s, 2.5 * s, 2 * s);

        // ---- HAIR ----
        ctx.fillStyle = PLAYER_PALETTE.hair;
        ctx.fillRect(bx - 1 * s, cy - 4 * s, 3 * s, 8 * s);  // hair behind head
        ctx.fillRect(bx, cy - 5 * s, 8 * s, 2 * s);           // hair across top of head

        // ---- HEAD ----
        ctx.fillStyle = PLAYER_PALETTE.skin;
        ctx.fillRect(bx, cy - 4 * s, 8 * s, 8 * s);

        // ---- EYES (face up — two eyes stacked vertically on screen) ----
        if (eyeOpen < 0.15) {
            // Closed eyelash lines
            ctx.fillStyle = '#443322';
            ctx.fillRect(bx + 3 * s, cy - 1.2 * s, 2.5 * s, 1);
            ctx.fillRect(bx + 3 * s, cy + 0.7 * s, 2.5 * s, 1);
        } else {
            const eyeW = Math.max(2, Math.round(eyeOpen * 2.5 * s));
            const eyeH = Math.max(1, Math.round(eyeOpen * 2 * s));
            const iW   = Math.max(1, Math.round(eyeOpen * 1.5 * s));
            // White sclera
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx + 3 * s, cy - 1.5 * s - eyeH, eyeW, eyeH);
            ctx.fillRect(bx + 3 * s, cy + 1.5 * s,        eyeW, eyeH);
            // Iris
            ctx.fillStyle = PLAYER_PALETTE.iris;
            ctx.fillRect(bx + 3.5 * s, cy - 1.5 * s - eyeH, iW, eyeH);
            ctx.fillRect(bx + 3.5 * s, cy + 1.5 * s,        iW, eyeH);
        }
    }

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
            // AGI-inspired barriers: shelves, mop bucket, door area
            e.addBarrier(25, 280, 195, 10);   // Lower shelf base blocks walking through it
            e.addBarrier(465, 306, 65, 22);    // Mop bucket
            e.addBarrier(345, 305, 35, 25);    // Floor drain

            // Foreground layer: bucket rim draws over player when walking behind it
            e.addForegroundLayer(319, (ctx, eng) => {
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
            if (!eng.getFlag('door_unlocked')) {
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
            eng.drawContactShadow(ctx, 394, 344, 1, { rx: 44, ry: 8, alpha: 0.34, light: null });
            // Boots and legs, foreshortened away from the viewer. Kept warm
            // (brown/rose) rather than grey so she reads against the cool
            // blue-grey corridor floor instead of blending into it.
            ctx.fillStyle = '#241c18';
            ctx.fillRect(430, 316, 12, 7);
            ctx.fillStyle = '#6e5850';
            ctx.fillRect(406, 318, 26, 10);
            ctx.fillStyle = '#82695f';
            ctx.fillRect(406, 318, 26, 2);
            // Hips
            ctx.fillStyle = '#5c473f';
            ctx.fillRect(394, 320, 14, 14);
            // Torso in a lab coat — largest mass because it is nearest
            ctx.fillStyle = '#ab9490';
            ctx.fillRect(370, 321, 26, 19);
            ctx.fillStyle = '#c4ada8';
            ctx.fillRect(370, 321, 26, 3);
            ctx.fillStyle = '#8a726d';
            ctx.fillRect(370, 337, 26, 3);
            // Coat lapel
            ctx.fillStyle = '#7a3a3a';
            ctx.fillRect(382, 324, 4, 13);
            // Shoulder rolled toward the floor
            ctx.fillStyle = '#b8a19c';
            ctx.fillRect(368, 324, 6, 12);
            // Outstretched arm and hand reaching toward the player
            ctx.fillStyle = '#ab9490';
            ctx.fillRect(356, 336, 16, 6);
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(348, 337, 9, 6);
            // Head, turned to one side
            ctx.fillStyle = '#CC9977';
            ctx.fillRect(354, 324, 17, 16);
            ctx.fillStyle = '#B98868';
            ctx.fillRect(354, 336, 17, 4);
            // Dark hair spilling onto the deck
            ctx.fillStyle = '#222233';
            ctx.fillRect(352, 322, 19, 7);
            ctx.fillRect(348, 326, 6, 12);
            ctx.fillStyle = '#33334a';
            ctx.fillRect(354, 322, 10, 2);

            // KEYCARD on body — only visible before pickup
            if (!eng.getFlag('got_keycard_corridor')) {
                const kcx = 375, kcy = 325;
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
            ctx.fillRect(360, 331, 3, 1);
            ctx.fillRect(366, 331, 3, 1);

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
            e.addForegroundLayer(285, (ctx, eng) => {
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
                        e.showMessage('Some uncharacteristically merciful instinct stops you. The science lab still has the sort of vital shipboard business that becomes a terrible problem three planets later.');
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
            e.addForegroundLayer(320, (ctx, eng) => {
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
            // Korvak's body is solid ground clutter, not something to stand inside
            e.addBarrier(218, 300, 46, 52);

            // Korvak draws as a y-sorted actor so the player passes behind him
            // correctly; the beam segment is re-drawn over his legs to pin him.
            e.addForegroundLayer(352, (ctx, eng) => {
                if (!eng.getFlag('korvak_freed')) {
                    eng.drawContactShadow(ctx, 240, 358, 1, { rx: 28, ry: 4, alpha: 0.28 });
                    // Legs run under the beam; head and torso stay clear of it.
                    ctx.fillStyle = '#555570';
                    ctx.fillRect(232, 292, 18, 20);
                    ctx.fillStyle = '#AA7755';
                    ctx.fillRect(233, 326, 16, 18);
                    ctx.fillStyle = '#224488';
                    ctx.fillRect(234, 328, 14, 12);
                    ctx.fillStyle = '#AA7755';
                    ctx.beginPath(); ctx.arc(241, 350, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#7a4a2c';
                    ctx.fillRect(234, 343, 14, 4);
                    ctx.fillStyle = '#AA7755';
                    ctx.fillRect(219, 334, 15, 6);
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
                    eng.drawContactShadow(ctx, 153, 342, 1, { rx: 14, ry: 3.5, alpha: 0.28 });
                    ctx.fillStyle = '#555570'; ctx.fillRect(145, 310, 16, 30);
                    ctx.fillStyle = '#AA7755'; ctx.fillRect(148, 306, 10, 16);
                    ctx.beginPath(); ctx.arc(153, 304, 7, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#224488'; ctx.fillRect(148, 308, 10, 14);
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
            ctx.strokeStyle = '#4a2a26'; ctx.lineWidth = 1;
            [36, 80, 122].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, lTop(x) + 5); ctx.lineTo(x, lBot(x) - 5); ctx.stroke(); });
            [524, 566, 606].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, rTop(x) + 5); ctx.lineTo(x, rBot(x) - 5); ctx.stroke(); });
            // Sickly red emergency wash
            ctx.fillStyle = 'rgba(150,30,20,0.10)';
            ctx.fillRect(0, 17, w, h - 17);
            alarmGlow(ctx, w, h, eng);

            // Large reactor column in centre
            ctx.fillStyle = '#2a2535';
            ctx.fillRect(295, 80, 50, 182);
            ctx.fillStyle = '#353045';
            ctx.fillRect(305, 90, 30, 162);
            // Reactor core glow (flickering)
            const rFlicker = 0.6 + Math.sin(eng.animTimer / 90) * 0.4;
            ctx.fillStyle = 'rgba(80,200,255,' + (rFlicker * 0.35) + ')';
            ctx.beginPath(); ctx.arc(320, 170, 28, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(160,240,255,' + (rFlicker * 0.55) + ')';
            ctx.beginPath(); ctx.arc(320, 170, 14, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#AAEEFF';
            ctx.beginPath(); ctx.arc(320, 170, 5, 0, Math.PI * 2); ctx.fill();
            // Reactor labels
            ctx.fillStyle = '#556677';
            ctx.font = '8px "Courier New"';
            ctx.fillText('REACTOR CORE', 298, 78);
            ctx.fillText('DANGER', 307, 270);

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
                useItem: (e, id) => e.showMessage('That won\'t help with a reactor meltdown.')
            },
            {
                name: 'Left Console',
                x: 28, y: 98, w: 96, h: 74,
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
                x: 518, y: 98, w: 96, h: 74,
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
            // Bay wall barriers
            e.addBarrier(0, 230, 80, 60);     // Left bay wall
            e.addBarrier(560, 230, 80, 60);   // Right bay wall
            e.addBarrier(160, 230, 300, 20);  // Freighter hull base
            e.addBarrier(254, 300, 24, 24);   // Pipz occupies her own patch of ground

            // Pipz draws as a y-sorted actor so the player passes behind her
            // correctly instead of always rendering in front.
            e.addForegroundLayer(322, (ctx, eng) => {
                if (eng.getFlag('pipz_left')) return;
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
            for (let bx of [0, 540]) {
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
                get hidden() { return engine.getFlag('pipz_left'); },
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
        if (e.getFlag('rescued_prisoners')) {
            return 'You grab the Quantum Drive and run for the airlock! The freed prisoners are already aboard your shuttle, which is now both a getaway craft and a serious fire-code violation. After the jump, Jorv and Mella reunite with Pipz at Kerona Docking Bay. From humble janitor to galactic hero... and, annoyingly, still the person everyone expects to clean up afterward. THE END.';
        }
        return 'You grab the Quantum Drive and run for the airlock! Behind you, alarms blare as the Draknoids realize what\'s happened. You sprint through the corridors, leap into your shuttle, and blast away just as the flagship turns to pursue. But it\'s too late — you jump to hyperspace with the Quantum Drive safely aboard. From humble janitor to galactic hero... the galaxy owes its future to one unlikely sanitation engineer. THE END.';
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

    // ========== START THE GAME ==========
    engine.start();
});
