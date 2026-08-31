// ============================================================
// STAR SWEEPER - PROCEDURAL SOUND ENGINE
// All sounds generated with Web Audio API — no audio files
// ============================================================

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.muted = false;
        this.volume = 0.3;
        this.blocked = false;
        this.onStateChange = null;
        // Called with a short label when a significant sound cannot be heard
        // (muted, suspended, or Web Audio unavailable) so the UI can caption it.
        this.onInaudibleCue = null;
    }

    /** Report a sound the player cannot currently hear, for visual captioning. */
    _cue(label) {
        if (!this.onInaudibleCue) return;
        if (this.getStatus() === 'on') return;
        this.onInaudibleCue(label);
    }

    /** Create AudioContext on first user gesture (required by browsers). Safe to call multiple times. */
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                return this.ctx.resume().then(() => {
                    this.blocked = false;
                    if (this.onStateChange) this.onStateChange();
                    return true;
                }).catch(() => {
                    this.blocked = true;
                    if (this.onStateChange) this.onStateChange();
                    return false;
                });
            }
            return Promise.resolve(this.ctx.state === 'running');
        }
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) throw new Error('Web Audio API unavailable');
            this.ctx = new AudioContextClass();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : this.volume;
            this.master.connect(this.ctx.destination);
            this.ctx.addEventListener('statechange', () => {
                if (this.onStateChange) this.onStateChange();
            });
            return this.init();
        } catch (e) {
            this.blocked = true;
            console.warn('Web Audio API not available');
            if (this.onStateChange) this.onStateChange();
            return Promise.resolve(false);
        }
    }

    getStatus() {
        if (this.blocked) return 'blocked';
        if (this.muted) return 'off';
        if (this.ctx && this.ctx.state === 'suspended') return 'paused';
        return 'on';
    }

    setMuted(m) {
        this.muted = m;
        if (this.master) this.master.gain.value = m ? 0 : this.volume;
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    // ---- Utility: oscillator with exponential decay envelope ----
    _osc(type, freq, start, dur, vol) {
        if (!this.ctx) return null;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(Math.min(vol || 0.3, 1), start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        o.connect(g);
        g.connect(this.master);
        o.start(start);
        o.stop(start + dur + 0.01);
        o.onended = () => { g.disconnect(); };
        return o;
    }

    // ---- Utility: filtered noise burst ----
    _noise(start, dur, vol, freq) {
        if (!this.ctx) return;
        const sr = this.ctx.sampleRate;
        const samples = Math.max(1, Math.floor(sr * dur));
        const buf = this.ctx.createBuffer(1, samples, sr);
        const data = buf.getChannelData(0);
        for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(Math.min(vol || 0.1, 1), start);
        g.gain.exponentialRampToValueAtTime(0.001, start + dur);
        if (freq) {
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = freq;
            f.Q.value = 1;
            src.connect(f);
            f.connect(g);
            src.onended = () => { f.disconnect(); g.disconnect(); };
        } else {
            src.connect(g);
            src.onended = () => { g.disconnect(); };
        }
        g.connect(this.master);
        src.start(start);
    }

    _t() { return this.ctx ? this.ctx.currentTime : 0; }

    // ================================================================
    // SOUND EFFECTS
    // ================================================================

    /** Soft boot-tap — plays on walking frame changes */
    footstep() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.05, 0.06, 900);
        this._osc('sine', 110 + Math.random() * 40, t, 0.04, 0.04);
    }

    /** Short click for action button / UI interaction */
    uiClick() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('square', 900, t, 0.025, 0.06);
        this._osc('sine', 1200, t + 0.012, 0.02, 0.04);
    }

    /** Ascending chime — item acquired (3-voice chiptune arpeggio) */
    pickup() {
        this._cue('item acquired');
        if (!this.ctx) return;
        const t = this._t();
        // Voice 1 (Lead square)
        this._osc('square', 659.25, t, 0.08, 0.09);         // E5
        this._osc('square', 830.61, t + 0.06, 0.08, 0.09);  // G#5
        this._osc('square', 987.77, t + 0.12, 0.08, 0.10);  // B5
        this._osc('square', 1318.51, t + 0.18, 0.22, 0.12); // E6
        // Voice 2 (Harmonic accompaniment)
        this._osc('triangle', 329.63, t, 0.15, 0.08);       // E4
        this._osc('triangle', 493.88, t + 0.12, 0.28, 0.08); // B4
        // Voice 3 (Chiptune sparkle)
        this._osc('sine', 1318.51, t + 0.18, 0.25, 0.06);
        this._osc('sine', 1661.22, t + 0.24, 0.20, 0.04);
    }

    /** Rising arpeggio — score points earned (Tandy 3-voice flourish) */
    scoreUp() {
        this._cue('points scored');
        if (!this.ctx) return;
        const t = this._t();
        // Voice 1 (Lead pulse arpeggio)
        this._osc('square', 523.25, t, 0.06, 0.08);         // C5
        this._osc('square', 659.25, t + 0.05, 0.06, 0.08);  // E5
        this._osc('square', 783.99, t + 0.10, 0.06, 0.08);  // G5
        this._osc('square', 1046.50, t + 0.15, 0.22, 0.10); // C6
        // Voice 2 (Harmonic 3rd)
        this._osc('triangle', 261.63, t, 0.12, 0.07);       // C4
        this._osc('triangle', 523.25, t + 0.10, 0.25, 0.06); // C5
        // Voice 3 (Upper shimmer)
        this._osc('sine', 1046.50, t + 0.15, 0.24, 0.06);
        this._osc('sine', 1318.51, t + 0.20, 0.18, 0.04);
    }

    /** Hydraulic hiss + mechanical clunk */
    doorOpen() {
        this._cue('door opens');
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.35, 0.1, 600);
        this._osc('sawtooth', 80, t, 0.12, 0.08);
        this._osc('sine', 250, t + 0.04, 0.25, 0.05);
    }

    /** Soft whoosh for screen transitions */
    roomTransition() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.25, 0.045, 2000);
        this._osc('sine', 350, t, 0.08, 0.03);
        this._osc('sine', 500, t + 0.04, 0.12, 0.025);
    }

    /** Descending buzzer — player died (Dissonant minor downward crash) */
    death() {
        this._cue('you have died');
        if (!this.ctx) return;
        const t = this._t();
        const o1 = this._osc('sawtooth', 466.16, t, 0.7, 0.16); // Bb4
        if (o1) o1.frequency.exponentialRampToValueAtTime(55, t + 0.7);
        const o2 = this._osc('square', 440, t, 0.65, 0.12);    // A4 (dissonant semitone)
        if (o2) o2.frequency.exponentialRampToValueAtTime(50, t + 0.65);
        this._noise(t + 0.08, 0.6, 0.06, 1200);
        this._osc('sawtooth', 110, t + 0.25, 0.55, 0.09);
    }

    /** Triumphant fanfare — victory! (4-voice brassy chiptune cadence) */
    victory() {
        this._cue('victory fanfare');
        if (!this.ctx) return;
        const t = this._t();
        // Fanfare motif
        const notes = [
            { f: 523.25, tOfs: 0.00, dur: 0.12 }, // C5
            { f: 659.25, tOfs: 0.12, dur: 0.12 }, // E5
            { f: 783.99, tOfs: 0.24, dur: 0.12 }, // G5
            { f: 1046.50, tOfs: 0.36, dur: 0.30 }, // C6
            { f: 880.00, tOfs: 0.68, dur: 0.14 }, // A5
            { f: 1046.50, tOfs: 0.84, dur: 0.14 }, // C6
            { f: 1174.66, tOfs: 1.00, dur: 0.60 }  // D6
        ];
        notes.forEach(n => {
            this._osc('square', n.f, t + n.tOfs, n.dur, 0.12);
            this._osc('triangle', n.f * 0.5, t + n.tOfs, n.dur, 0.08);
            this._osc('sine', n.f * 2, t + n.tOfs, n.dur * 0.8, 0.04);
        });
        // Final sustained grand chord
        this._osc('square', 1046.50, t + 1.6, 1.2, 0.10); // C6
        this._osc('square', 1318.51, t + 1.6, 1.2, 0.08); // E6
        this._osc('square', 1567.98, t + 1.6, 1.2, 0.08); // G6
        this._osc('triangle', 523.25, t + 1.6, 1.4, 0.12); // C5 bass
    }

    /** Descending zap — energy weapon */
    laser() {
        this._cue('weapon fires');
        if (!this.ctx) return;
        const t = this._t();
        const o = this._osc('sawtooth', 1500, t, 0.25, 0.22);
        if (o) o.frequency.exponentialRampToValueAtTime(150, t + 0.25);
        this._osc('square', 900, t, 0.1, 0.1);
        this._noise(t, 0.07, 0.08, 3000);
    }

    /** Low double-buzz — action failed */
    error() {
        this._cue('that did not work');
        if (!this.ctx) return;
        const t = this._t();
        this._osc('square', 220, t, 0.1, 0.08);
        this._osc('square', 165, t + 0.1, 0.15, 0.06);
    }

    /** Ascending triple-beep — game saved/loaded */
    save() {
        this._cue('game saved');
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 550, t, 0.05, 0.07);
        this._osc('sine', 740, t + 0.05, 0.05, 0.07);
        this._osc('sine', 990, t + 0.1, 0.1, 0.05);
    }

    /** Harsh scraping — prying metal */
    metalScrape() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.45, 0.09, 400);
        const o = this._osc('sawtooth', 120, t, 0.35, 0.1);
        if (o) o.frequency.linearRampToValueAtTime(280, t + 0.35);
        this._osc('sawtooth', 90, t + 0.08, 0.25, 0.07);
    }

    /** Ethereal shimmer — crystal energy */
    crystalHum() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 440, t, 0.5, 0.04);
        this._osc('sine', 660, t + 0.05, 0.45, 0.035);
        this._osc('sine', 880, t + 0.1, 0.4, 0.025);
        this._osc('triangle', 1320, t + 0.15, 0.35, 0.015);
    }

    /** Main title motif — optimistic space-opera ascent with a comic final turn. */
    titleTheme() {
        if (!this.ctx) return;
        const t = this._t();
        const melody = [392.00, 523.25, 659.25, 783.99, 659.25, 880.00, 783.99];
        melody.forEach((freq, i) => {
            const offset = i < 4 ? i * 0.16 : 0.72 + (i - 4) * 0.18;
            const duration = i === melody.length - 1 ? 0.55 : 0.14;
            this._osc('square', freq, t + offset, duration, 0.055);
            this._osc('triangle', freq * 0.5, t + offset, duration + 0.06, 0.04);
        });
        this._osc('sine', 196.00, t, 1.65, 0.045);
        this._osc('sine', 293.66, t + 1.08, 0.38, 0.035);
    }

    /** The janitor's motif — a brisk working tune ending one note short of heroic. */
    playerMotif() {
        if (!this.ctx) return;
        const t = this._t();
        const notes = [261.63, 329.63, 392.00, 523.25, 466.16];
        notes.forEach((freq, i) => {
            const offset = i < 4 ? i * 0.12 : 0.58;
            this._osc('square', freq, t + offset, i === 4 ? 0.34 : 0.10, 0.045);
            if (i < 4) this._osc('triangle', freq * 0.5, t + offset, 0.16, 0.025);
        });
    }

    /** Draknoid leitmotif — low tritone steps heard on entering their ship. */
    draknoidMotif() {
        if (!this.ctx) return;
        const t = this._t();
        const notes = [73.42, 103.83, 77.78, 110.00];
        notes.forEach((freq, i) => {
            const offset = i * 0.28;
            this._osc('sawtooth', freq, t + offset, 0.38, 0.045);
            this._osc('sine', freq * 2, t + offset + 0.03, 0.30, 0.025);
        });
        this._osc('triangle', 36.71, t, 1.35, 0.05);
    }

    /** Dramatic title flourish — game begins. */
    gameStart() {
        this.titleTheme();
    }

    /** Deep boom — explosions, impacts */
    explosion() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.5, 0.18, 200);
        this._noise(t + 0.04, 0.35, 0.12, 600);
        this._osc('sine', 50, t, 0.3, 0.1);
        this._osc('sawtooth', 35, t + 0.06, 0.35, 0.07);
    }

    /** Cash register ding — commerce */
    sell() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('triangle', 1300, t, 0.035, 0.1);
        this._osc('triangle', 1600, t + 0.035, 0.035, 0.08);
        this._osc('sine', 2100, t + 0.07, 0.1, 0.06);
        this._noise(t + 0.05, 0.025, 0.04, 4000);
    }

    /** Garbled alien speech */
    talk() {
        if (!this.ctx) return;
        const t = this._t();
        const base = 140 + Math.random() * 80;
        for (let i = 0; i < 4; i++) {
            this._osc('sawtooth', base + Math.random() * 50, t + i * 0.06, 0.045, 0.025);
        }
    }

    /** Gulp/pour — drinking */
    drink() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.1, 0.04, 1200);
        this._osc('sine', 180, t + 0.03, 0.07, 0.025);
        this._osc('sine', 220, t + 0.07, 0.08, 0.02);
    }

    /** Rocket ignition rumble — pod/shuttle launch */
    pod() {
        if (!this.ctx) return;
        const t = this._t();
        this._noise(t, 0.7, 0.1, 300);
        this._osc('sawtooth', 55, t, 0.5, 0.08);
        this._osc('sine', 70, t + 0.12, 0.4, 0.06);
        const o = this._osc('sawtooth', 90, t + 0.2, 0.5, 0.1);
        if (o) o.frequency.exponentialRampToValueAtTime(250, t + 0.7);
    }

    /** Rising sweep — hyperspace jump */
    hyperspace() {
        if (!this.ctx) return;
        const t = this._t();
        const o = this._osc('sine', 220, t, 0.7, 0.08);
        if (o) o.frequency.exponentialRampToValueAtTime(1800, t + 0.7);
        this._osc('triangle', 440, t, 0.5, 0.04);
        this._noise(t + 0.15, 0.55, 0.05, 1500);
    }

    /** Two-tone alert — alarm siren (single burst) */
    alarm() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('square', 800, t, 0.12, 0.05);
        this._osc('square', 600, t + 0.12, 0.12, 0.05);
    }

    /** Quick blip — text appears */
    blip() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 700, t, 0.035, 0.03);
    }

    // ================================================================
    // AMBIENT / LOOPING SOUND SYSTEM
    // Procedural background audio that loops per-room
    // ================================================================

    /** Stop any currently playing ambient sound */
    stopAmbient() {
        if (this._ambientTimer) {
            clearInterval(this._ambientTimer);
            this._ambientTimer = null;
        }
        if (this._ambientNodes) {
            this._ambientNodes.forEach(n => { try { n.stop(); } catch(e) {} });
            this._ambientNodes = [];
        }
        this._ambientType = null;
    }

    /** Start a looping ambient sound for the given room type */
    startAmbient(type) {
        if (!this.ctx) return;
        this.stopAmbient();
        this._ambientType = type;
        this._ambientNodes = [];

        switch (type) {
            case 'ship_alarm':
                // Ship interior: low engine hum + periodic alarm klaxon
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    // Low engine rumble
                    this._osc('sine', 45 + Math.random() * 5, t, 1.8, 0.025);
                    this._osc('sine', 90, t + 0.3, 1.2, 0.015);
                    // Alarm wail (two-tone)
                    this._osc('square', 780, t + 0.1, 0.15, 0.02);
                    this._osc('square', 580, t + 0.25, 0.15, 0.02);
                    this._osc('square', 780, t + 0.8, 0.15, 0.02);
                    this._osc('square', 580, t + 0.95, 0.15, 0.02);
                }, 2000);
                break;

            case 'cantina_music':
                // Alien jazz: repeating pattern of funky notes + rhythm
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    // Bass line
                    const bassNotes = [110, 130, 147, 110, 165, 130, 147, 123];
                    bassNotes.forEach((f, i) => {
                        this._osc('triangle', f, t + i * 0.25, 0.22, 0.025);
                    });
                    // Melody - alien pentatonic
                    const melody = [440, 520, 587, 440, 660, 520, 587, 784];
                    melody.forEach((f, i) => {
                        if (Math.random() > 0.3) {
                            this._osc('sine', f + Math.random() * 10, t + i * 0.25 + 0.05, 0.15, 0.015);
                        }
                    });
                    // Percussion - light taps
                    for (let i = 0; i < 8; i++) {
                        if (i % 2 === 0 || Math.random() > 0.5) {
                            this._noise(t + i * 0.25, 0.04, 0.015, 2000 + Math.random() * 2000);
                        }
                    }
                }, 2200);
                break;

            case 'desert_wind':
                // Desert: wind howls + sand rustling
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    this._noise(t, 2.5, 0.02, 400 + Math.random() * 200);
                    // Occasional stronger gust
                    if (Math.random() > 0.5) {
                        this._noise(t + 0.5, 1.5, 0.03, 300 + Math.random() * 300);
                    }
                }, 2800);
                break;

            case 'cave_drip':
                // Cave: echoing drips + distant rumble
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    // Low cavern resonance
                    this._osc('sine', 55, t, 2.0, 0.012);
                    // Random drips
                    const numDrips = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < numDrips; i++) {
                        const dt = Math.random() * 2;
                        this._osc('sine', 800 + Math.random() * 400, t + dt, 0.06, 0.015);
                    }
                }, 2500);
                break;

            case 'outpost_crowd':
                // Outpost: crowd murmur + alien chatter
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    // Crowd murmur (low noise)
                    this._noise(t, 2.0, 0.015, 300);
                    // Random alien speech snippets
                    for (let i = 0; i < 3; i++) {
                        const dt = Math.random() * 1.5;
                        const base = 120 + Math.random() * 100;
                        this._osc('sawtooth', base, t + dt, 0.04, 0.008);
                    }
                }, 2200);
                break;

            case 'ship_hum':
                // Generic ship interior: just engine hum, no alarm
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    this._osc('sine', 48, t, 2.0, 0.02);
                    this._osc('sine', 96, t + 0.2, 1.5, 0.01);
                    // Occasional electronic blip
                    if (Math.random() > 0.6) {
                        this._osc('sine', 600 + Math.random() * 400, t + Math.random() * 1.5, 0.05, 0.008);
                    }
                }, 2200);
                break;

            case 'draknoid_ship':
                // Alien ship: deep ominous drone + electronic pulses
                this.draknoidMotif();
                this._ambientTimer = setInterval(() => {
                    if (this.muted || !this.ctx) return;
                    const t = this._t();
                    this._osc('sawtooth', 38, t, 2.2, 0.02);
                    this._osc('sine', 76, t + 0.1, 1.8, 0.015);
                    // Ominous pulse
                    this._osc('sine', 150, t + 0.5, 0.3, 0.012);
                    this._osc('sine', 150, t + 1.3, 0.3, 0.012);
                    // Electronic hiss
                    if (Math.random() > 0.4) {
                        this._noise(t + Math.random() * 1.5, 0.2, 0.01, 1500);
                    }
                }, 2400);
                break;
        }
    }

    /** Release AudioContext resources */
    dispose() {
        this.stopAmbient();
        if (this.ctx) {
            try { this.ctx.close(); } catch (e) { /* already closed */ }
            this.ctx = null;
            this.master = null;
        }
    }
}
