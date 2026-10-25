class SpeechService {
    constructor() {
        this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
        this.enabled = true;
        this.lang = 'pt-BR';
        this.rate = 0.9;
        this.pitch = 1;
        this.voice = null;
        this.debug = true;
        this._unlocked = false;
        this._token = 0;
        this._atual = null;
        if (this.supported) {
            this._loadVoices();
            window.speechSynthesis.onvoiceschanged = () => this._loadVoices();
        }
    }

    _log(...a) { if (this.debug) console.log('[Speech]', ...a); }

    _loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    this.voice =
        voices.find(v => v.name === 'Luciana') ||
        voices.find(v => v.lang === 'pt-BR') ||
        voices.find(v => v.lang.toLowerCase().startsWith('pt')) ||
        null;
}

    unlock() {
        if (!this.supported || this._unlocked) return;
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        window.speechSynthesis.speak(u);
        this._unlocked = true;
    }

    _cancelar() {
        this._token++;
        if (this.supported) {
            const synth = window.speechSynthesis;
            if (synth.speaking || synth.pending) {
                synth.cancel();
                this._precisaFolga = true;
            }
        }
        return this._token;
    }

    _falar(text, token, { onStart, onEnd } = {}) {
        const synth = window.speechSynthesis;
        synth.resume();
        const u = new SpeechSynthesisUtterance(text);
        u.onstart = () => { this._log('onstart'); if (token === this._token) onStart?.(); };
        const fim = () => { this._log('fim'); if (token === this._token) onEnd?.(); };
        u.onend = fim;
        u.onerror = (e) => { this._log('erro:', e.error); fim(); };

        this._atual = u;
        this._log('falando:', text);
        synth.speak(u);
        this._log('estado', { speaking: synth.speaking, pending: synth.pending, paused: synth.paused });
    }

    speak(text, opts = {}) {
        if (!this.supported || !this.enabled || !text) {
            this._log('speak ignorado', { supported: this.supported, enabled: this.enabled, text });
            return;
        }
        const token = this._cancelar();
        setTimeout(() => {
            if (token === this._token) this._falar(text, token, opts);
        }, this._precisaFolga ? 200 : 0);
    }

    speakSequence(items, { onEnd } = {}) {
        if (!this.supported || !this.enabled) {
            this._log('sequência ignorada', { supported: this.supported, enabled: this.enabled });
            return;
        }
        const token = this._cancelar();

        const tocar = (lista) => {
            if (token !== this._token) return;
            const [first, ...rest] = lista;
            if (!first) { onEnd?.(); return; }
            const item = typeof first === 'string' ? { text: first } : first;
            this._falar(item.text, token, { onStart: item.onStart, onEnd: () => tocar(rest) });
        };

        setTimeout(() => tocar(items), this._precisaFolga ? 200 : 0);
    }

    stop() { this._cancelar(); }

    setEnabled(value) {
        this.enabled = value;
        if (!value) this.stop();
    }
}

export default new SpeechService();