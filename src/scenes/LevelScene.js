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
        this.opcaoSelecionada = null;
        this.respondido = false;
    }

    preload() { }

    async create() {
        const fase = await LevelService.getFaseById(this.levelId);

        if (!fase) {
            new ErrorToast(this, 'Erro ao carregar a fase. Tente novamente.');
            return;
        }

        this.fase = fase;
        this.centroX = this.scale.width / 2;
        this.criarEnunciado();
        this.criarOpcoes();
        this.criarBotaoVoltar();
    }

    criarEnunciado() {
        this.add.text(
            this.centroX,
            this.scale.height * 0.2,
            this.fase.enunciado,
            {
                ...Theme.textStyles.title,
                wordWrap: { width: Math.min(1200, this.scale.width * 0.8) }
            }
        ).setOrigin(0.5).setDepth(10);
    }

    criarOpcoes() {
        const inicioY = this.scale.height * 0.4;
        const espacamento = 80;

        this.botoesOpcoes = (this.fase.opcoes || []).map((opcao, index) => {
            const y = inicioY + index * espacamento;

            const texto = this.add.text(
                this.centroX,
                y,
                opcao.texto,
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

            return texto;
        });
    }

    selecionarOpcao(opcao, textoObj) {
        if (this.respondido) return;
        this.respondido = true;

        textoObj.setStyle({ backgroundColor: opcao.ehCorreta ? Theme.colors.string.success : Theme.colors.string.error });
        
        const style = opcao.ehCorreta ? Theme.textStyles.feedbackSuccess : Theme.textStyles.feedbackError;
        this.add.text(960, 750, opcao.ehCorreta ? 'Resposta correta!' : 'Resposta incorreta.', style).setOrigin(0.5);
        this.botoesOpcoes.forEach(btn => btn.disableInteractive());

        if (opcao.ehCorreta) {
            const estrelas = 3;
            LevelService.finalizarFase(this.levelId, estrelas);
        }
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