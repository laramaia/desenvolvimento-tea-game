import Phaser from 'phaser';
import { LevelService } from '../services/LevelService';
import { Theme } from '../config/Theme';
import { ErrorToast } from '../ui/ErrorToast';
import { AvatarState } from '../state/AvatarState';
import { AvatarView } from '../ui/Avatar/AvatarView';
import { carregarAssetsAvatar } from '../ui/Avatar/AvatarAssets';
import { OptionButton } from '../ui/Button/OptionButton';
import SpeechService from '../services/SpeechService'
import { GameState } from '../state/GameState'
import { LevelManager } from '../managers/LevelManager';
import { SpeechBubble } from '../ui/SpeechBubble';

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
        this.manager = null;
        this.respondido = false;
        this.botoesOpcoes = [];
        this.elementosTela = [];
        this.yFimOpcoes = 0;
        this.geo = null;
    }

    preload() {
        carregarAssetsAvatar(this);
        this.load.image('icon-sound-on', '../../../assets/sprites/ui/icons/icon-sound-on.png');
        this.load.image('icon-sound-off', '../../../assets/sprites/ui/icons/icon-sound-off.png');
        this.load.image('balao-fala', '../../../assets/sprites/ui/icons/balao-fala.png');
    }

    async create() {
        const fase = await LevelService.getFaseById(this.levelId);
        const manager = new LevelManager(fase);
        if (manager.total === 0) {
            new ErrorToast(this, 'Erro ao carregar as perguntas da fase. Tente novamente.');
            return;
        }

        this.manager = manager;
        this.calcularGeometria();
        this.criarBotaoVoltar();
        this.criarAvatar();
        this.criarBotaoVoz();
        this.criarBalao();
        this.carregarPerguntaAtual();
        this.aoRedimensionar = () => this.layout();
        this.scale.on('resize', this.aoRedimensionar, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.aoRedimensionar, this);
            SpeechService.stop();
            this.balao?.parar();
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
        const s = this.geo.s;
        this.voiceBtn
            .setPosition(this.scale.gameSize.width - Theme.spacing.xl, Theme.spacing.xl)
            .setDisplaySize(44 * s, 44 * s);
        this.posicionarBalao();

        if (!this.respondido) this.carregarPerguntaAtual({ falar: false });
    }

    criarAvatar() {
        const { x, y, w, h } = this.geo.avatar;
        this.avatarView = new AvatarView(this, AvatarState.carregar(), { comFundo: false })
            .setDepth(5)
            .definirArea(x, y, w, h);
    }

    carregarPerguntaAtual({ falar = true } = {}) {
        this.elementosTela.forEach((el) => el.destroy());
        this.elementosTela = [];
        this.botoesOpcoes = [];
        this.respondido = false;

        const g = this.geo;
        const pergunta = this.manager.perguntaAtual;
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
            const btn = new OptionButton(this, opcao.texto, {
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

        if (falar && GameState.settings.autoReadQuestion) {
            this.time.delayedCall(400, () => this.lerPerguntaCompleta());
        }

    }

    selecionarOpcao(opcao, btn) {
        if (this.respondido) return;
        this.respondido = true;

        const { correta, concluida } = this.manager.responder(opcao);
        this.fimDaFala();
        SpeechService.speak(correta ? 'Resposta correta!' : 'Resposta incorreta. Tente de novo.');

        btn.marcar(correta);
        this.botoesOpcoes.forEach((b) => b.bloquear());

        const style = correta ? Theme.textStyles.feedbackSuccess : Theme.textStyles.feedbackError;
        const txtFeedback = this.add.text(
            this.geo.colunaX,
            this.yFimOpcoes,
            correta ? 'Resposta correta!' : 'Resposta incorreta.',
            {
                ...style,
                fontFamily: Theme.fonts.family,
                fontStyle: 'bold',
                fontSize: `${Math.round(15 * this.geo.s)}px`,
            }
        ).setOrigin(0, 0).setDepth(15);
        this.elementosTela.push(txtFeedback);

        this.time.delayedCall(1500, () => {
            if (concluida) {
                LevelService.finalizarFase(this.levelId, 3);
                this.scene.start('MapScene');
                return;
            }
            if (correta) this.manager.avancar();
            this.carregarPerguntaAtual();
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

    criarBotaoVoz() {
        const { width } = this.scale.gameSize;
        const tam = 44 * this.geo.s;
        const chave = GameState.settings.voiceEnabled ? 'icon-sound-on' : 'icon-sound-off';
        this.voiceBtn = this.add.image(width - Theme.spacing.xl, Theme.spacing.xl, chave)
            .setOrigin(1, 0)
            .setDisplaySize(tam, tam)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
        this.voiceBtn.on('pointerdown', () => this.alternarVoz());
    }

    alternarVoz() {
        const ativo = !GameState.settings.voiceEnabled;
        GameState.updateSettings({ voiceEnabled: ativo });
        SpeechService.setEnabled(ativo);
        this.voiceBtn.setTexture(ativo ? 'icon-sound-on' : 'icon-sound-off');
        if (!ativo) this.fimDaFala();
    }

    criarBalao() {
        this.balao = new SpeechBubble(this, {
            aoTocar: () => {
                if (!GameState.settings.voiceEnabled) this.alternarVoz();
                this.lerPerguntaCompleta();
            },
        });
        this.posicionarBalao();
    }

    posicionarBalao() {
        const s = this.geo.s;
        const { x, y, w } = this.geo.avatar;
        this.balao.posicionar(x + w / 2 + 34 * s, y + 4 * s, 64 * s);
    }

    lerPerguntaCompleta() {
        const p = this.manager.perguntaAtual;
        const itens = [
            { text: p.enunciado, onStart: () => { this.destacar(-1); this.balao.iniciar(); } },
            ...(p.opcoes || []).map((o, i) => ({
                text: o.texto,
                onStart: () => this.destacar(i),
            })),
        ];

        SpeechService.speakSequence(itens, { onEnd: () => this.fimDaFala() });
    }

    destacar(indice) {
        this.botoesOpcoes.forEach((b, i) => b.setDestaque?.(i === indice));
    }

    fimDaFala() {
        this.destacar(-1);
        this.balao?.parar();
    }
}