import Phaser from 'phaser';
import { Sidebar } from '../ui/Sidebar/Sidebar';
import { LevelNode } from '../objects/LevelNode';
import { Theme } from '../config/Theme';
import { LevelService } from '../services/LevelService';
import { ErrorToast } from '../ui/ErrorToast';
import { CoinCounter } from '../ui/CoinCounter';
import { MapHeader } from '../ui/MapHeader';
import { MapToast } from '../ui/MapToast';

export class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    preload() {
        this.load.image(Theme.backgrounds.map, '/assets/backgrounds/bg-map.png');
        this.load.image('logo', '/assets/branding/logo.png');
        this.load.image('spr_trail', '/assets/sprites/trail.png');
        this.load.image('spr_level_node_locked', '/assets/sprites/level-node/level-node-locked.png');
        this.load.image('spr_level_node_completed', '/assets/sprites/level-node/level-node-completed.png');
        this.load.image('spr_level_node_current', '/assets/sprites/level-node/level-node-current.png');
        this.load.image('spr_level_node_special', '/assets/sprites/level-node/level-node-special.png');
        this.load.image('spr_icon_coin', '/assets/sprites/ui/icons/icon-coin.png');
        this.load.image('spr_icon_map_header', '/assets/sprites/ui/icons/icon-map-header.png');
        this.load.image('spr_icon_map_footer', '/assets/sprites/ui/icons/icon-map-footer.png');
    }

    async create() {
        this.bg = this.add.image(0, 0, Theme.backgrounds.map).setOrigin(0, 0).setDepth(0);
        this.trailBg = this.add.image(0, 0, 'spr_trail').setOrigin(0, 0).setDepth(1);

        const carregamentoTexto = this.add.text(
            960,
            540,
            'Carregando fases...',
            Theme.textStyles.title
        ).setOrigin(0.5).setDepth(30);

        this.levelsData = await LevelService.getLevels();
        carregamentoTexto.destroy();

        if (!this.levelsData || this.levelsData.length === 0) {
            new ErrorToast(this, 'Erro ao processar dados. Verifique sua conexão e tente novamente.');
            return;
        }

        const iniciarDesafio = (id) => {
            console.log(`Iniciando a fase ${id}...`);
            this.scene.start('LevelScene', { levelId: id });
        };

        this.sidebar = new Sidebar(this);
        if (this.sidebar.container) {
            this.sidebar.container.setDepth(20);
        }
        this.mapHeader = new MapHeader(this, 0, 0, 1, 'Início da Jornada', 10);
        this.mapHeader.setDepth(25);
        this.coinCounter = new CoinCounter(this, 0, 0, 0);
        this.coinCounter.setDepth(25);
        this.mapToast = new MapToast(this, 0, 0, 'Complete as atividades para ganhar estrelas e desbloquear novas fases!');
        this.mapToast.setDepth(25);

        this.levelNodes = this.levelsData.map(fase => {
            const pos = this.calcularPosicaoNode(fase, this.scale.gameSize);
            const node = new LevelNode(
                this,
                pos.x,
                pos.y,
                fase.id,
                fase.status,
                fase.status === 'locked' ? null : iniciarDesafio
            );
            node.setDepth(10);
            return node;
        });

        this.redimensionarCena(this.scale.gameSize);
        this.scale.on('resize', this.redimensionarCena, this);

        const aoRedimensionar = () => {
            this.scale.refresh();
            this.redimensionarCena(this.scale.gameSize);
        };

        window.addEventListener('resize', aoRedimensionar);

        this.events.once('shutdown', () => {
            window.removeEventListener('resize', aoRedimensionar);
        });
    }

    calcularPosicaoNode(fase, tamanhoJogo) {
        const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(tamanhoJogo) : 220;
        const larguraUtil = tamanhoJogo.width - larguraSidebar;

        return {
            x: larguraSidebar + (larguraUtil * (fase.xRatio ?? 0)),
            y: tamanhoJogo.height * (fase.yRatio ?? 0)
        };
    }

    redimensionarCena(tamanhoJogo) {
        if (this.bg) {
            this.bg.setDisplaySize(tamanhoJogo.width, tamanhoJogo.height);
        }

        if (this.sidebar) {
            this.sidebar.redimensionar(tamanhoJogo);
        }

        const margemTopo = tamanhoJogo.height * 0.136;
        const margemLateral = tamanhoJogo.width * 0.052;

        if (this.mapHeader) {
            if (this.mapHeader.ajustarEscalaContainer) {
                this.mapHeader.ajustarEscalaContainer();
            }
            const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(tamanhoJogo) : 220;
            this.mapHeader.setPosition(larguraSidebar + margemLateral, margemTopo);
        }

        if (this.coinCounter) {
            if (this.coinCounter.ajustarEscalaContainer) {
                this.coinCounter.ajustarEscalaContainer();
            }

            const larguraContador = this.coinCounter.getLarguraTotal
                ? this.coinCounter.getLarguraTotal()
                : 150;

            this.coinCounter.setPosition(tamanhoJogo.width - margemLateral - larguraContador, margemTopo);
        }

        if (this.trailBg) {
            const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(tamanhoJogo) : 220;
            const margemDaSidebar = tamanhoJogo.width * 0.06;
            const deslocX = larguraSidebar + margemDaSidebar;
            const deslocY = tamanhoJogo.height * 0.40;
            const novaLargura = (tamanhoJogo.width - deslocX);
            const novaAltura = tamanhoJogo.height * 0.45;
            this.trailBg.setPosition(deslocX, deslocY);
            this.trailBg.setDisplaySize(novaLargura, novaAltura);
        }

        if (this.levelNodes && this.levelsData) {
            this.levelNodes.forEach((node, index) => {
                const pos = this.calcularPosicaoNode(this.levelsData[index], tamanhoJogo);
                node.setPosition(pos.x, pos.y);
                if (node.atualizarEscala) {
                    node.atualizarEscala();
                }
            });
        }

        if (this.mapToast) {
            if (this.mapToast.ajustarEscalaContainer) {
                this.mapToast.ajustarEscalaContainer();
            }

            const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(tamanhoJogo) : 220;
            const larguraUtil = tamanhoJogo.width - larguraSidebar;
            const folgaSeguranca = tamanhoJogo.width * 0.04;
            const larguraMaxPermitida = larguraUtil - folgaSeguranca;
            this.mapToast.desenharFundo(larguraMaxPermitida);
            const posX = larguraSidebar + (larguraUtil / 2);
            const posY = tamanhoJogo.height * 0.92;
            this.mapToast.setPosition(posX, posY);
        }
    }
}