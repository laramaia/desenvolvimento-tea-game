import Phaser from 'phaser';
import { Sidebar } from '../ui/Sidebar/Sidebar';
import { LevelNode } from '../objects/LevelNode';
import { Theme } from '../config/Theme';
import { LevelService } from '../services/LevelService';
import { ErrorPopup } from '../ui/ErrorPopup';
import { CoinCounter } from '../ui/CoinCounter';
import { MapHeader } from '../ui/MapHeader';

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
    }

    async create() {
        this.bg = this.add.image(0, 0, Theme.backgrounds.map).setOrigin(0, 0).setDepth(0);
        this.trailBg = this.add.image(0, 0, 'spr_trail').setOrigin(0, 0).setDepth(1);

        const loadingText = this.add.text(
            960,
            540,
            'Carregando fases...',
            Theme.textStyles.title
        ).setOrigin(0.5).setDepth(30);

        this.levelsData = await LevelService.getLevels();
        loadingText.destroy();

        if (!this.levelsData || this.levelsData.length === 0) {
            new ErrorPopup(this, 'Erro ao processar dados. Verifique sua conexão e tente novamente.');
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
        this.levelNodes = this.levelsData.map(level => {
            const pos = this.calcularPosicaoNode(level, this.scale.gameSize);
            const node = new LevelNode(
                this,
                pos.x,
                pos.y,
                level.id,
                level.status,
                level.status === 'locked' ? null : iniciarDesafio
            );
            node.setDepth(10);
            return node;
        });
        this.redimensionarCena(this.scale.gameSize);
        this.scale.on('resize', this.redimensionarCena, this);

        const handleResize = () => {
            this.scale.refresh();
            this.redimensionarCena(this.scale.gameSize);
        };

        window.addEventListener('resize', handleResize);

        this.events.once('shutdown', () => {
            window.removeEventListener('resize', handleResize);
        });
    }

    calcularPosicaoNode(levelData, gameSize) {
        const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(gameSize) : 220;
        const larguraUtil = gameSize.width - larguraSidebar;

        return {
            x: larguraSidebar + (larguraUtil * (levelData.xRatio ?? 0)),
            y: gameSize.height * (levelData.yRatio ?? 0)
        };
    }

    redimensionarCena(gameSize) {
        if (this.bg) {
            this.bg.setDisplaySize(gameSize.width, gameSize.height);
        }

        if (this.sidebar) {
            this.sidebar.redimensionar(gameSize);
        }

        const paddingTop = gameSize.height * 0.136; 
        const margemLateral = gameSize.width * 0.052;

        if (this.mapHeader) {
            if (this.mapHeader.ajustarEscalaContainer) {
                this.mapHeader.ajustarEscalaContainer();
            }
            const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(gameSize) : 220;
            this.mapHeader.setPosition(larguraSidebar + margemLateral, paddingTop);
        }

        if (this.coinCounter) {
            // Adicione esta chamada que estava faltando!
            if (this.coinCounter.ajustarEscalaContainer) {
                this.coinCounter.ajustarEscalaContainer();
            }

            const larguraContador = this.coinCounter.getLarguraTotal
                ? this.coinCounter.getLarguraTotal()
                : 150;

            this.coinCounter.setPosition(gameSize.width - margemLateral - larguraContador, paddingTop);
        }

        if (this.trailBg) {
            const larguraSidebar = this.sidebar ? this.sidebar.getLarguraAtual(gameSize) : 220;
            const margemDaSidebar = gameSize.width * 0.06
            const offsetX = larguraSidebar + margemDaSidebar;
            const offsetY = gameSize.height * 0.40;

            const novaLargura = (gameSize.width - offsetX);
            const novaAltura = gameSize.height * 0.45;

            this.trailBg.setPosition(offsetX, offsetY);
            this.trailBg.setDisplaySize(novaLargura, novaAltura);
        }

        if (this.levelNodes && this.levelsData) {
            this.levelNodes.forEach((node, index) => {
                const pos = this.calcularPosicaoNode(this.levelsData[index], gameSize);
                node.setPosition(pos.x, pos.y);
                if (node.atualizarEscala) {
                    node.atualizarEscala();
                }
            });
        }
    }
}