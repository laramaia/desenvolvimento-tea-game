import { Theme } from '../config/Theme';

export class Question {
    constructor(scene, perguntas = [], callbacks = {}) {
        this.scene = scene;

        this.perguntas = Array.isArray(perguntas) ? perguntas : [];

        this.perguntaAtual = 0;
        this.acertos = 0;
        this.respondido = false;

        this.callbacks = {
            onResponder: callbacks.onResponder || (() => { }),
            onProximaPergunta: callbacks.onProximaPergunta || (() => { }),
            onFinalizar: callbacks.onFinalizar || (() => { })
        };

        this.enunciado = null;
        this.botoesOpcoes = [];
        this.feedback = null;
    }

    iniciar() {
        if (this.perguntas.length === 0) {
            console.warn('Nenhuma pergunta foi recebida.');
            return;
        }

        this.perguntaAtual = 0;
        this.acertos = 0;

        this.mostrarPergunta();
    }

    getPerguntaAtual() {
        return this.perguntas[this.perguntaAtual] || null;
    }

    getNumeroPergunta() {
        return this.perguntaAtual + 1;
    }

    getTotalPerguntas() {
        return this.perguntas.length;
    }

    mostrarPergunta() {
        this.limparPergunta();

        const pergunta = this.getPerguntaAtual();

        if (!pergunta) {
            this.finalizar();
            return;
        }

        this.respondido = false;

        const centroX = this.scene.scale.width / 2;

        this.enunciado = this.scene.add.text(
            centroX,
            this.scene.scale.height * 0.2,
            pergunta.enunciado || pergunta.pergunta || '',
            {
                ...Theme.textStyles.title,
                wordWrap: {
                    width: Math.min(1200, this.scene.scale.width * 0.8)
                }
            }
        )
            .setOrigin(0.5)
            .setDepth(10);

        this.criarOpcoes(pergunta);

        this.callbacks.onProximaPergunta({
            numero: this.getNumeroPergunta(),
            total: this.getTotalPerguntas(),
            pergunta
        });
    }

    criarOpcoes(pergunta) {
        const inicioY = this.scene.scale.height * 0.4;
        const espacamento = 80;
        const centroX = this.scene.scale.width / 2;

        const opcoes = pergunta.opcoes || pergunta.alternativas || [];

        this.botoesOpcoes = opcoes.map((opcao, index) => {
            const y = inicioY + index * espacamento;

            const textoOpcao =
                opcao.texto ||
                opcao.descricao ||
                opcao.alternativa ||
                '';

            const texto = this.scene.add.text(
                centroX,
                y,
                textoOpcao,
                Theme.textStyles.optionButton
            )
                .setOrigin(0.5)
                .setDepth(10)
                .setInteractive({ useHandCursor: true });

            texto.on('pointerdown', () => {
                this.selecionarOpcao(opcao, texto);
            });

            texto.on('pointerover', () => {
                if (!this.respondido) {
                    texto.setStyle({
                        backgroundColor: Theme.colors.string.primaryHover
                    });
                }
            });

            texto.on('pointerout', () => {
                if (!this.respondido) {
                    texto.setStyle({
                        backgroundColor: Theme.colors.string.primary
                    });
                }
            });

            return texto;
        });
    }

    selecionarOpcao(opcao, textoObj) {
        if (this.respondido) return;

        this.respondido = true;

        const correta =
            Boolean(opcao.ehCorreta) ||
            Boolean(opcao.isCorrect) ||
            Boolean(opcao.correta);

        if (correta) {
            this.acertos++;
        }

        textoObj.setStyle({
            backgroundColor: correta
                ? Theme.colors.string.success
                : Theme.colors.string.error
        });

        const style = correta
            ? Theme.textStyles.feedbackSuccess
            : Theme.textStyles.feedbackError;

        this.feedback = this.scene.add.text(
            this.scene.scale.width / 2,
            this.scene.scale.height * 0.82,
            correta
                ? 'Resposta correta!'
                : 'Resposta incorreta.',
            style
        )
            .setOrigin(0.5)
            .setDepth(20);

        this.botoesOpcoes.forEach(btn => {
            btn.disableInteractive();
        });

        this.callbacks.onResponder({
            pergunta: this.getPerguntaAtual(),
            numero: this.getNumeroPergunta(),
            correta,
            acertos: this.acertos,
            total: this.getTotalPerguntas()
        });
    }

    proximaPergunta() {
        if (!this.respondido) return;

        this.perguntaAtual++;

        if (this.perguntaAtual >= this.perguntas.length) {
            this.finalizar();
            return;
        }

        this.mostrarPergunta();
    }

    finalizar() {
        this.callbacks.onFinalizar({
            acertos: this.acertos,
            total: this.perguntas.length,
            perguntas: this.perguntas
        });
    }

    limparPergunta() {
        if (this.enunciado) {
            this.enunciado.destroy();
            this.enunciado = null;
        }

        if (this.feedback) {
            this.feedback.destroy();
            this.feedback = null;
        }

        this.botoesOpcoes.forEach(btn => {
            if (btn) btn.destroy();
        });

        this.botoesOpcoes = [];
    }

    destruir() {
        this.limparPergunta();
    }
}