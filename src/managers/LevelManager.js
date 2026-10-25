const normalizarOpcao = (o) => ({
    ...o,
    texto: o.texto ?? o.Texto,
    ehCorreta: o.ehCorreta ?? o.EhCorreta,
});

export class LevelManager {
    constructor(fase) {
        this.perguntas = (fase?.perguntas ?? fase?.Perguntas ?? []).map((p) => ({
            ...p,
            enunciado: p.enunciado ?? p.Enunciado,
            opcoes: (p.opcoes ?? p.Opcoes ?? []).map(normalizarOpcao),
        }));
        this.indice = 0;
        this.erros = 0;
    }

    get total() { return this.perguntas.length; }
    get perguntaAtual() { return this.perguntas[this.indice]; }
    get ehUltima() { return this.indice >= this.total - 1; }

    responder(opcao) {
        const correta = !!opcao.ehCorreta;
        if (!correta) this.erros++;
        return { correta, concluida: correta && this.ehUltima };
    }

    avancar() {
        if (!this.ehUltima) this.indice++;
    }
}