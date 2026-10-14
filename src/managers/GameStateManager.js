export class GameStateManager {
    static pacienteId = null;
    static moedas = 0;
    static faseAtual = 1;
    static progressoFases = {}; 

    static init() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('pacienteId');
        this.pacienteId = id ? parseInt(id, 10) : null;

        if (!this.pacienteId) {
            console.warn('Nenhum pacienteId na URL — jogo rodando sem paciente vinculado.');
        }
    }

    static adicionarMoedas(quantidade) {
        this.moedas += quantidade;
    }

    static atualizarStatusFase(faseId, status) {
        this.progressoFases[faseId] = status;
    }

    static reset() {
        this.moedas = 0;
        this.progressoFases = {};
    }
}