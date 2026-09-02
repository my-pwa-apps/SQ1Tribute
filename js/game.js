// ============================================================
// STAR SWEEPER - GAME CONTENT
// All rooms, items, puzzles, and artwork
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    const STAR_SWEEPER_GAME = StarSweeperContent.game;

    const engine = new GameEngine(STAR_SWEEPER_GAME);
    window.engine = engine;

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

        // Draw the real broom closet room. Dimming is a tinted scrim rather
        // than globalAlpha, which would fade the art toward flat grey.
        function drawRoom(ctx, w, h, dim) {
            const room = engine.rooms['broom_closet'];
            if (room && room.draw) room.draw(ctx, w, h, engine);
            if (dim > 0) {
                ctx.fillStyle = `rgba(4,6,26,${Math.min(dim, 1)})`;
                ctx.fillRect(0, 0, w, h);
            }
        }

        // Ship alert readouts are screen overlays: they get their own backing
        // plate for legibility and must not ride the screen shake.
        function drawAlertPanel(ctx, w, headline, headlineBright, lines) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            const lineH = 15;
            const boxW = 380;
            const boxH = 40 + lines.length * lineH + 10;
            const bx = Math.round((w - boxW) / 2), by = 24;
            // Bezel: black shadow, brushed housing, inset screen.
            ctx.fillStyle = '#000000';
            ctx.fillRect(bx - 4, by - 4, boxW + 8, boxH + 8);
            ctx.fillStyle = '#3a3140';
            ctx.fillRect(bx, by, boxW, boxH);
            ctx.fillStyle = '#544857';
            ctx.fillRect(bx, by, boxW, 2);
            ctx.fillStyle = '#241d29';
            ctx.fillRect(bx, by + boxH - 3, boxW, 3);
            // Hazard header strip
            for (let i = 0; i * 10 < boxW - 12; i++) {
                ctx.fillStyle = i % 2 ? '#c8a416' : '#1b1b28';
                ctx.fillRect(bx + 6 + i * 10, by + 5, 10, 4);
            }
            // Inset screen
            ctx.fillStyle = '#0b0508';
            ctx.fillRect(bx + 8, by + 13, boxW - 16, boxH - 22);
            ctx.strokeStyle = '#AA0000';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx + 9, by + 14, boxW - 18, boxH - 24);
            ctx.fillStyle = 'rgba(0,0,0,0.16)';
            for (let sy = by + 14; sy < by + boxH - 10; sy += 4) ctx.fillRect(bx + 9, sy, boxW - 18, 1);
            // Corner rivets
            ctx.fillStyle = '#8a7c92';
            [[bx + 4, by + 4], [bx + boxW - 7, by + 4], [bx + 4, by + boxH - 7], [bx + boxW - 7, by + boxH - 7]]
                .forEach(([rx, ry]) => ctx.fillRect(rx, ry, 3, 3));
            ctx.textAlign = 'center';
            ctx.font = 'bold 16px "Courier New"';
            ctx.fillStyle = headlineBright ? '#FF5555' : '#CC3333';
            ctx.fillText(headline, w / 2, by + 31);
            ctx.font = '14px "Courier New"';
            ctx.fillStyle = '#FFFF55';
            lines.forEach((line, i) => ctx.fillText(line, w / 2, by + 48 + i * lineH));
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
            const lh = 21;
            const padY = 12;
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
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'center';
            lines.forEach((line, i) => {
                ctx.fillText(line, w / 2, boxY + padY + 15 + i * lh);
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
                    // Establishing shot: the Constellation adrift off a gas giant.
                    ctx.fillStyle = '#000008';
                    ctx.fillRect(0, 0, w, h);
                    stars(ctx, w, h, 20240, 170);
                    // Gas giant limb, upper left, lit from the right.
                    ctx.save();
                    ctx.beginPath(); ctx.arc(24, 34, 132, 0, Math.PI * 2); ctx.clip();
                    ctx.fillStyle = '#3a2a55';
                    ctx.fillRect(-120, -100, 300, 300);
                    ['#4a3568', '#2f2246', '#55407a', '#392a55', '#4a3568'].forEach((c, i) => {
                        ctx.fillStyle = c;
                        ctx.fillRect(-120, -90 + i * 34, 300, 20);
                    });
                    ctx.fillStyle = 'rgba(0,0,12,0.6)';
                    ctx.beginPath(); ctx.arc(-40, 34, 132, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                    ctx.strokeStyle = 'rgba(190,170,240,0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(24, 34, 131, -0.5, 1.1); ctx.stroke();
                    ctx.lineWidth = 1;
                    // The survey vessel, drifting slowly to port.
                    const shipX = 366 - Math.min(t, 6000) / 1000 * 7;
                    drawShipSilhouette(ctx, shipX, 262, 2.2);
                    // Lit habitat windows and a blinking beacon.
                    ctx.fillStyle = '#FFEE99';
                    for (let i = 0; i < 9; i++) ctx.fillRect(shipX - 70 + i * 16, 256, 4, 3);
                    ctx.fillStyle = Math.floor(t / 600) % 2 ? '#FF5544' : '#5a1c16';
                    ctx.fillRect(shipX + 104, 254, 4, 4);
                    ctx.fillStyle = 'rgba(90,190,255,0.35)';
                    ctx.fillRect(shipX - 146, 256, 16, 12);
                    // Console readout plate
                    const rx = 150, ry = 38, rw = 340, rh = 150;
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(rx - 4, ry - 4, rw + 8, rh + 8);
                    ctx.fillStyle = '#26313a';
                    ctx.fillRect(rx, ry, rw, rh);
                    ctx.fillStyle = '#3b4a56';
                    ctx.fillRect(rx, ry, rw, 2);
                    ctx.fillStyle = '#08120c';
                    ctx.fillRect(rx + 8, ry + 8, rw - 16, rh - 16);
                    ctx.strokeStyle = '#2f6b3f';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(rx + 9, ry + 9, rw - 18, rh - 18);
                    ctx.lineWidth = 1;
                    ctx.fillStyle = '#8a9aa6';
                    [[rx + 4, ry + 4], [rx + rw - 7, ry + 4], [rx + 4, ry + rh - 7], [rx + rw - 7, ry + rh - 7]]
                        .forEach(([cx, cy]) => ctx.fillRect(cx, cy, 3, 3));
                    ctx.font = '16px "Courier New"';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = `rgba(85,255,85,${fade})`;
                    ctx.fillText('ISS CONSTELLATION', w / 2, 62);
                    ctx.fillText('DEEP SPACE SURVEY VESSEL', w / 2, 80);
                    ctx.fillStyle = `rgba(85,255,85,${fade * 0.9})`;
                    ctx.fillRect(rx + 30, 88, rw - 60, 1);
                    ctx.font = '14px "Courier New"';
                    ctx.fillText('CREW: 147  |  MISSION DAY: 2,847', w / 2, 104);
                    ctx.fillText('SECTOR: GAMMA QUADRANT, UNCHARTED ZONE', w / 2, 120);
                    if (t > 1800) {
                        const f2 = Math.min((t - 1800) / 1200, 1);
                        ctx.fillStyle = `rgba(210,210,210,${f2})`;
                        ctx.fillText('SHIP STATUS: ALL SYSTEMS NOMINAL', w / 2, 142);
                        ctx.fillText('TIME: 03:47 SHIP STANDARD', w / 2, 158);
                    }
                    if (t > 3200) {
                        const f3 = Math.min((t - 3200) / 800, 1);
                        ctx.fillStyle = `rgba(210,210,210,${f3})`;
                        ctx.fillText('LOCATION: SUPPLY CLOSET J-6', w / 2, 174);
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
                    const roomDim = Math.max(0.5, 1 - t / 2500);
                    drawRoom(ctx, w, h, roomDim);
                    const breathe = Math.sin(elapsed / 400) * 1.5;
                    // Night-light pool so the sleeping ego reads in the dark.
                    ctx.fillStyle = 'rgba(255,225,160,0.07)';
                    ctx.beginPath(); ctx.ellipse(268, 322, 80, 26, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,225,160,0.09)';
                    ctx.beginPath(); ctx.ellipse(268, 322, 52, 18, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,235,190,0.10)';
                    ctx.beginPath(); ctx.ellipse(268, 322, 30, 11, 0, 0, Math.PI * 2); ctx.fill();
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
                    drawRoom(ctx, w, h, 0.5 - wakeProg * 0.3);
                    const standProg = Math.min(wakeProg * 1.5, 1);
                    const px = 300, baseY = 310;
                    if (standProg < 0.4) {
                        const breathe = Math.sin(elapsed / 400) * 1;
                        // eyeOpen: starts fully closed, begins opening past standProg 0.2
                        const eyeOpen = standProg > 0.2 ? (standProg - 0.2) / 0.2 : 0;
                        drawPlayerSleeping(ctx, 258, 322 + breathe, eyeOpen);
                    } else if (standProg < 0.7) {
                        // Sit-up: the shared ego cel, drawn low and rising, so
                        // the intro cannot use a different character again.
                        const s = engine.playerSpriteScale(310);
                        const sitP = (standProg - 0.4) / 0.3;
                        const riseY = 310 + (1 - sitP) * 13 * s;
                        ctx.save();
                        // Crouched: squash vertically and lean back as he pushes up.
                        ctx.translate(px, riseY);
                        ctx.scale(1, 0.62 + sitP * 0.38);
                        ctx.rotate((1 - sitP) * -0.12);
                        drawPlayerBody(ctx, 0, 0, s, 0.5);
                        ctx.restore();
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
                    drawRoom(ctx, w, h, 0.2);
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
                    drawRoom(ctx, w, h, 0.2);
                    if (totalFlash > 0) {
                        ctx.fillStyle = `rgba(255,50,0,${totalFlash * 0.5})`;
                        ctx.fillRect(0, 0, w, h);
                    }
                    alarmGlow(ctx, w, h, engine);
                    const stumble = Math.sin(elapsed / 120) * 10;
                    const stumbleY = Math.sin(elapsed / 90) * 3;
                    drawPlayerBody(ctx, 300 + stumble, 310 + stumbleY, engine.playerSpriteScale(310 + stumbleY), Math.sin(elapsed / 200) * 0.5 + 0.5);
                    for (let i = 0; i < 16; i++) {
                        // Debris and dust shaken loose from the ceiling.
                        const seed = i * 137;
                        const dx = 60 + ((seed * 7) % 520);
                        const dy = 16 + ((elapsed * (0.16 + (i % 5) * 0.06) + seed) % 300);
                        if (i % 3 === 0) {
                            ctx.fillStyle = 'rgba(255,200,80,0.9)';
                            ctx.fillRect(dx, dy, 2, 5);
                        } else {
                            ctx.fillStyle = 'rgba(150,140,120,0.55)';
                            ctx.fillRect(dx, dy, 2, 2);
                        }
                    }
                    ctx.fillStyle = 'rgba(120,100,80,0.12)';
                    ctx.fillRect(0, 16, w, 60);
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
                    drawRoom(ctx, w, h, 0.2);
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
                    drawRoom(ctx, w, h, 0.2);
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

    // Shared art helpers live in js/art.js; rooms in js/rooms/*.js.
    StarSweeper.installRooms(engine);

    // ========== START THE GAME ==========
    engine.start();
});
