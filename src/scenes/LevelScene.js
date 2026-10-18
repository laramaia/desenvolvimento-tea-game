import Phaser from 'phaser';
import { LevelService } from '../services/LevelService';
import { Theme } from '../config/Theme';
import { ErrorToast } from '../ui/ErrorToast';
import { AvatarState } from '../state/AvatarState';
import { AvatarView } from '../ui/Avatar/AvatarView';
import { carregarAssetsAvatar } from '../ui/Avatar/AvatarAssets';
import { OptionButton } from '../ui/Button/OptionButton';


const REF = {
    largura: 772,
    altura: 401,
    coluna: { x: 169, w: 246 },
    pergunta: { x: 178, y: 97, fonte: 15, wrap: 270 },
    opcao: { h: 40, gap: 12, fonteRatio: 0.29, distanciaDaPergunta: 15 },
    avatar: { cx: 510, cy: 190, h: 220, w: 120 }, 
};

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
        this.yFimOpcoes = 0;
        this.geo = null;
    }

    preload() {
        carregarAssetsAvatar(this);
    }

    async create() {
        const fase = await LevelService.getFaseById(this.levelId);

        if (!fase || !fase.perguntas || fase.perguntas.length === 0) {
            new ErrorToast(this, 'Erro ao carregar as perguntas da fase. Tente novamente.');
            return;
        }

        this.fase = fase;

        this.calcularGeometria();
        this.criarBotaoVoltar();
        this.criarAvatar();
        this.carregarPerguntaAtual();

        this.aoRedimensionar = () => this.layout();
        this.scale.on('resize', this.aoRedimensionar, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.aoRedimensionar, this);
        });
    }

    calcularGeometria() {
        const { width, height } = this.scale.gameSize;
        const s = Math.min(width / REF.largura, height / REF.altura);
        const ox = (width - REF.largura * s) / 2;
        const oy = (height - REF.altura * s) / 2;

        const X = (v) => ox + v * s;
        const Y = (v) => oy + v * s;

        this.geo = {
            s,
            colunaX: X(REF.coluna.x),
            colunaW: REF.coluna.w * s,
            perguntaX: X(REF.pergunta.x),
            perguntaY: Y(REF.pergunta.y),
            perguntaFonte: Math.round(REF.pergunta.fonte * s),
            perguntaWrap: REF.pergunta.wrap * s,
            altOpcao: REF.opcao.h * s,
            gapOpcao: REF.opcao.gap * s,
            distancia: REF.opcao.distanciaDaPergunta * s,
            avatar: {
                x: X(REF.avatar.cx) - (REF.avatar.w * s) / 2,
                y: Y(REF.avatar.cy) - (REF.avatar.h * s) / 2,
                w: REF.avatar.w * s,
                h: REF.avatar.h * s,
            },
        };
    }

    layout() {
        this.calcularGeometria();
        const { x, y, w, h } = this.geo.avatar;
        this.avatarView.definirArea(x, y, w, h);

        if (!this.respondido) this.carregarPerguntaAtual();
    }


    criarAvatar() {
        const { x, y, w, h } = this.geo.avatar;
        this.avatarView = new AvatarView(this, AvatarState.carregar(), { comFundo: false })
            .setDepth(5)
            .definirArea(x, y, w, h);
    }


    carregarPerguntaAtual() {
        this.elementosTela.forEach((el) => el.destroy());
        this.elementosTela = [];
        this.botoesOpcoes = [];
        this.respondido = false;

        const g = this.geo;
        const pergunta = this.fase.perguntas[this.currentPerguntaIndex];

        const txtEnunciado = this.add.text(g.perguntaX, g.perguntaY, pergunta.enunciado, {
            ...Theme.textStyles.title,
            fontFamily: Theme.fonts.family,
            fontSize: `${g.perguntaFonte}px`,
            align: 'left',
            wordWrap: { width: g.perguntaWrap },
        }).setOrigin(0, 0).setDepth(10);
        this.elementosTela.push(txtEnunciado);

        let y = g.perguntaY + txtEnunciado.height + g.distancia;

        this.botoesOpcoes = (pergunta.opcoes || []).map((opcao) => {
            const btn = new OptionButton(this, opcao.texto ?? opcao.Texto, {
                largura: g.colunaW,
                altura: g.altOpcao,
                aoClicar: () => this.selecionarOpcao(opcao, btn),
            });

            btn.setPosition(g.colunaX + g.colunaW / 2, y + btn.altura / 2).setDepth(10);
            y += btn.altura + g.gapOpcao;

            this.elementosTela.push(btn);
            return btn;
        });

        this.yFimOpcoes = y;
    }

    selecionarOpcao(opcao, btn) {
        if (this.respondido) return;
        this.respondido = true;

        const ehCorreta = opcao.ehCorreta ?? opcao.EhCorreta;

        btn.marcar(ehCorreta);
        this.botoesOpcoes.forEach((b) => b.bloquear());

        const style = ehCorreta ? Theme.textStyles.feedbackSuccess : Theme.textStyles.feedbackError;
        const txtFeedback = this.add.text(
            this.geo.colunaX,
            this.yFimOpcoes,
            ehCorreta ? 'Resposta correta!' : 'Resposta incorreta.',
            {
                ...style,
                fontFamily: Theme.fonts.family,
                fontStyle: 'bold',
                fontSize: `${Math.round(15 * this.geo.s)}px`,
            }
        ).setOrigin(0, 0).setDepth(15);
        this.elementosTela.push(txtFeedback);

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

        btnVoltar.on('pointerdown', () => this.scene.start('MapScene'));
    }
}