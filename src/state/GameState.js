const SETTINGS_KEY = 'tea-game-settings';

const DEFAULT_SETTINGS = {
    voiceEnabled: true,
    voiceRate: 0.9,
    autoReadQuestion: true, // lê a pergunta ao entrar na fase
};

export class GameState {
    static pacienteId = null;
    static settings = { ...DEFAULT_SETTINGS };

    static init() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('pacienteId');
        this.pacienteId = id ? parseInt(id, 10) : null;

        if (!this.pacienteId) {
            console.warn('Nenhum pacienteId na URL — jogo rodando sem paciente vinculado.');
        }

        this.loadSettings();
    }

    // Chave por paciente: cada criança mantém sua preferência
    static _storageKey() {
        return this.pacienteId ? `${SETTINGS_KEY}-${this.pacienteId}` : SETTINGS_KEY;
    }

    static loadSettings() {
        try {
            const raw = localStorage.getItem(this._storageKey());
            this.settings = { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
        } catch (e) {
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    static updateSettings(partial) {
        this.settings = { ...this.settings, ...partial };
        try {
            localStorage.setItem(this._storageKey(), JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Não foi possível salvar as configurações.', e);
        }
    }
}