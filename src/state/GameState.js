export class GameState {
    static pacienteId = null;

    static init() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('pacienteId');
        this.pacienteId = id ? parseInt(id, 10) : null;

        if (!this.pacienteId) {
            console.warn('Nenhum pacienteId na URL — jogo rodando sem paciente vinculado.');
        }
    }
}