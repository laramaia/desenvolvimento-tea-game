import Phaser from 'phaser';
import { LevelService } from '../services/LevelService';
import { Theme } from '../config/Theme';
import { ErrorToast } from '../ui/ErrorToast';

export class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    init(data) {
        this.levelId = data.levelId;
        this.currentPerguntaIndex = 0;
        this.respondido = false;
        this.botoesOpcoes = [];
        this.elementosTela = []; 
    }

    async create() {
        const fase = await LevelService.getFaseById(this.levelId);

        if (!fase || !fase.perguntas || fase.perguntas.length === 0) {
            new ErrorToast(this, 'Erro ao carregar as perguntas da fase. Tente novamente.');
            return;
        }

        this.fase = fase;
        this.centroX = this.scale.width / 2;
        
        this.criarBotaoVoltar();
        this.carregarPerguntaAtual();
    }

    carregarPerguntaAtual() {
        this.elementosTela.forEach(el => el.destroy());
        this.elementosTela = [];
        this.botoesOpcoes = [];
        this.respondido = false;

        const perguntaAtual = this.fase.perguntas[this.currentPerguntaIndex];

        const txtProgresso = this.add.text(
            this.centroX,
            this.scale.height * 0.12,
            `Pergunta ${this.currentPerguntaIndex + 1} de ${this.fase.perguntas.length}`,
            { ...Theme.textStyles.subtitle, color: '#a5a1ff' }
        ).setOrigin(0.5).setDepth(10);
        this.elementosTela.push(txtProgresso);

        const txtEnunciado = this.add.text(
            this.centroX,
            this.scale.height * 0.23,
            perguntaAtual.enunciado,
            {
                ...Theme.textStyles.title,
                wordWrap: { width: Math.min(1200, this.scale.width * 0.8) }
            }
        ).setOrigin(0.5).setDepth(10);
        this.elementosTela.push(txtEnunciado);

        const inicioY = this.scale.height * 0.42;
        const espacamento = 85;

        this.botoesOpcoes = (perguntaAtual.opcoes || []).map((opcao, index) => {
            const y = inicioY + index * espacamento;

            const texto = this.add.text(
                this.centroX,
                y,
                opcao.texto ?? opcao.Texto,
                Theme.textStyles.optionButton
            )
                .setOrigin(0.5)
                .setDepth(10)
                .setInteractive({ useHandCursor: true });

            texto.on('pointerdown', () => this.selecionarOpcao(opcao, texto));
            texto.on('pointerover', () => {
                if (!this.respondido) texto.setStyle({ backgroundColor: Theme.colors.string.primaryHover });
            });
            texto.on('pointerout', () => {
                if (!this.respondido) texto.setStyle({ backgroundColor: Theme.colors.string.primary });
            });

            this.elementosTela.push(texto);
            return texto;
        });
    }

    selecionarOpcao(opcao, textoObj) {
        if (this.respondido) return;
        this.respondido = true;

        const ehCorreta = opcao.ehCorreta ?? opcao.EhCorreta;

        textoObj.setStyle({ backgroundColor: ehCorreta ? Theme.colors.string.success : Theme.colors.string.error });
        
        const style = ehCorreta ? Theme.textStyles.feedbackSuccess : Theme.textStyles.feedbackError;
        const txtFeedback = this.add.text(
            this.centroX, 
            this.scale.height * 0.78, 
            ehCorreta ? 'Resposta correta!' : 'Resposta incorreta.', 
            style
        ).setOrigin(0.5).setDepth(15);
        this.elementosTela.push(txtFeedback);

        this.botoesOpcoes.forEach(btn => btn.disableInteractive());

        this.time.delayedCall(1500, () => {
            if (ehCorreta) {
                if (this.currentPerguntaIndex < this.fase.perguntas.length - 1) {
                    this.currentPerguntaIndex++;
                    this.carregarPerguntaAtual();
                } else {
                    LevelService.finalizarFase(this.levelId, 3);
                    this.scene.start('MapScene');
                }
            } else {
                this.carregarPerguntaAtual();
            }
        });
    }

    criarBotaoVoltar() {
        const btnVoltar = this.add.text(
            Theme.spacing.xl,
            Theme.spacing.xl,
            '< Voltar ao mapa',
            Theme.textStyles.backButton
        )
            .setDepth(10)
            .setInteractive({ useHandCursor: true });

        btnVoltar.on('pointerdown', () => {
            this.scene.start('MapScene');
        });
    }
}