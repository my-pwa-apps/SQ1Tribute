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
    }

    /** Create AudioContext on first user gesture (required by browsers). Safe to call multiple times. */
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : this.volume;
            this.master.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API not available');
        }
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
        } else {
            src.connect(g);
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

    /** Ascending chime — item acquired */
    pickup() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 660, t, 0.1, 0.15);
        this._osc('sine', 880, t + 0.07, 0.1, 0.14);
        this._osc('sine', 1100, t + 0.14, 0.12, 0.12);
        this._osc('triangle', 1320, t + 0.2, 0.2, 0.09);
    }

    /** Rising arpeggio — score points earned */
    scoreUp() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 523, t, 0.07, 0.09);
        this._osc('sine', 659, t + 0.07, 0.07, 0.09);
        this._osc('sine', 784, t + 0.14, 0.07, 0.09);
        this._osc('triangle', 1047, t + 0.21, 0.22, 0.07);
        this._osc('sine', 1047, t + 0.21, 0.22, 0.05);
    }

    /** Hydraulic hiss + mechanical clunk */
    doorOpen() {
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

    /** Descending buzzer — player died */
    death() {
        if (!this.ctx) return;
        const t = this._t();
        const o = this._osc('sawtooth', 440, t, 0.7, 0.18);
        if (o) o.frequency.exponentialRampToValueAtTime(55, t + 0.7);
        this._osc('square', 220, t + 0.05, 0.5, 0.07);
        this._noise(t + 0.1, 0.6, 0.05);
        this._osc('sine', 110, t + 0.3, 0.5, 0.08);
    }

    /** Triumphant fanfare — victory! */
    victory() {
        if (!this.ctx) return;
        const t = this._t();
        const notes = [523, 659, 784, 1047, 1319, 1568];
        notes.forEach((f, i) => {
            this._osc('sine', f, t + i * 0.1, 0.25, 0.1);
            this._osc('triangle', f * 1.001, t + i * 0.1, 0.25, 0.05);
        });
        // Final sustained chord
        this._osc('sine', 1047, t + 0.6, 0.9, 0.07);
        this._osc('sine', 1319, t + 0.65, 0.85, 0.05);
        this._osc('sine', 1568, t + 0.7, 0.8, 0.04);
    }

    /** Descending zap — energy weapon */
    laser() {
        if (!this.ctx) return;
        const t = this._t();
        const o = this._osc('sawtooth', 1500, t, 0.25, 0.22);
        if (o) o.frequency.exponentialRampToValueAtTime(150, t + 0.25);
        this._osc('square', 900, t, 0.1, 0.1);
        this._noise(t, 0.07, 0.08, 3000);
    }

    /** Low double-buzz — action failed */
    error() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('square', 220, t, 0.1, 0.08);
        this._osc('square', 165, t + 0.1, 0.15, 0.06);
    }

    /** Ascending triple-beep — game saved/loaded */
    save() {
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

    /** Dramatic boot-up chord — game begins */
    gameStart() {
        if (!this.ctx) return;
        const t = this._t();
        this._osc('sine', 220, t, 0.18, 0.07);
        this._osc('sine', 330, t + 0.1, 0.16, 0.07);
        this._osc('sine', 440, t + 0.2, 0.14, 0.08);
        this._osc('triangle', 660, t + 0.3, 0.1, 0.07);
        this._osc('sine', 880, t + 0.38, 0.25, 0.1);
        this._osc('triangle', 880, t + 0.38, 0.25, 0.05);
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
}
