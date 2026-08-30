import Phaser from 'phaser';
import { Theme } from '../../config/Theme';
import { SidebarButton } from './SidebarButton';

export class Sidebar {
    constructor(scene) {
        this.scene = scene;
        this.container = this.scene.add.container(0, 0);
        this.botoes = [];

        this.criarBackground();
        this.criarLinhaDivisoria();
        this.criarLogo();
        this.criarBotoes();
    }

    getLarguraAtual(gameSize) {
        const gameWidth = gameSize ? gameSize.width : this.scene.scale.width;
        const larguraCalculada = gameWidth * Theme.sidebar.widthRatio;
        return Math.max(larguraCalculada, Theme.sidebar.minWidth);
    }

    criarBackground() {
        this.bg = this.scene.add.rectangle(0, 0, 1, 1, Theme.colors.hex.primary).setOrigin(0, 0);
        this.container.add(this.bg);
    }

    criarLinhaDivisoria() {
        this.linhaDivisoria = this.scene.add.graphics();
        this.container.add(this.linhaDivisoria);
    }

    desenharLinhaDivisoria(largura, altura) {
        this.linhaDivisoria.clear();
        this.linhaDivisoria.lineStyle(
            Theme.sidebar.divider.width,
            Theme.colors.hex.accent,
            Theme.sidebar.divider.alpha
        );
        this.linhaDivisoria.lineBetween(largura, 0, largura, altura);
    }

    criarLogo() {
        this.logo = this.scene.add.image(0, 0, 'logo').setOrigin(0.5, 0);
        this.container.add(this.logo);
    }

    criarBotoes() {
        const nomesBotoes = ['Jornada', 'Recompensas', 'Configurações', 'Sair'];

        nomesBotoes.forEach((nome) => {
            const btn = new SidebarButton(this.scene, 0, 0, nome, () => {
                console.log(`Clicou no botão: ${nome}`);
            });
            this.container.add(btn);
            this.botoes.push(btn);
        });
    }

    posicionarElementos(gameSize) {
        const largura = this.getLarguraAtual(gameSize);
        const altura = gameSize.height;
        const centroX = largura / 2;
        const marginTopLogo = Theme.spacing.lg || 16;

        this.logo.setPosition(centroX, marginTopLogo);

        const larguraLogoDesejada = largura * 0.65;
        const escalaLogo = larguraLogoDesejada / this.logo.width;

        this.logo.setScale(escalaLogo);
        
        const alturaLogoUsada = marginTopLogo + (this.logo.height * escalaLogo);
        const areaRestanteY = altura - alturaLogoUsada;
        const gap = Theme.sidebar.buttonGap || 15;
        const alturaTotalBotoes = this.botoes.reduce((acc, btn) => acc + btn.altura, 0) + (gap * (this.botoes.length - 1));
        const inicioY = alturaLogoUsada + ((areaRestanteY - alturaTotalBotoes) / 2);

        this.botoes.forEach((btn, index) => {
            const posY = inicioY + (index * (btn.altura + gap)) + (btn.altura / 2);
            btn.setPosition(centroX, posY);
        });
    }

    redimensionar(gameSize) {
        const largura = this.getLarguraAtual(gameSize);
        const altura = gameSize.height;

        this.bg.setSize(largura, altura);
        this.desenharLinhaDivisoria(largura, altura);

        this.botoes.forEach(btn => {
            if (btn.redimensionar) btn.redimensionar(largura);
        });

        this.posicionarElementos(gameSize);
    }
}