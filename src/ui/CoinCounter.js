import Phaser from 'phaser';
import { Theme } from '../config/Theme';
import { calcularEscalaResponsiva } from '../utils/responsiveScale';

export class CoinCounter extends Phaser.GameObjects.Container {
    constructor(scene, x, y, quantidadeInicial = 0) {
        super(scene, x, y);
        this.scene = scene;
        this.quantidade = quantidadeInicial;
        this.bg = scene.add.graphics();

        this.icone = scene.add.image(0, 0, 'spr_icon_coin')
            .setOrigin(0, 0.5)
            .setScale(Theme.coinCounter.iconScale);

        const larguraIcone = this.icone.displayWidth;

        this.texto = scene.add.text(
            larguraIcone + Theme.coinCounter.iconGap,
            0,
            `x${this.quantidade}`,
            Theme.textStyles.title
        )
            .setFontSize(Theme.coinCounter.fontSize)
            .setOrigin(0, 0.5);

        this.add([this.bg, this.icone, this.texto]);
        this.ajustarEscalaContainer();
        this.desenharFundo();
        scene.add.existing(this);
    }

    ajustarEscalaContainer() {
        const larguraAtual = this.scene.scale.width;
        const escalaGeral = calcularEscalaResponsiva(larguraAtual, {
            larguraBase: Theme.hudPanel.scaleBaseWidth,
            min: Theme.coinCounter.scaleMin,
            max: Theme.coinCounter.scaleMax,
        });
        this.setScale(escalaGeral);
    }

    desenharFundo() {
        this.bg.clear();

        const { paddingX, paddingY, iconGap } = Theme.coinCounter;
        const { cornerRadius, borderWidth, borderColor, bgColor } = Theme.hudPanel;

        const larguraConteudo = this.icone.displayWidth + iconGap + this.texto.displayWidth;
        const larguraTotal = larguraConteudo + (paddingX * 2);
        const alturaTotal = Math.max(this.icone.displayHeight, this.texto.displayHeight) + (paddingY * 2);
        const x = -paddingX;
        const y = -alturaTotal / 2;

        this.bg.lineStyle(borderWidth, borderColor, 1);
        this.bg.fillStyle(bgColor, 1);
        this.bg.fillRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
        this.bg.strokeRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
    }

    atualizar(novaQuantidade) {
        this.quantidade = novaQuantidade;
        this.texto.setText(`x${this.quantidade}`);
        this.ajustarEscalaContainer();
        this.desenharFundo();
    }

    getLarguraTotal() {
        const { paddingX, iconGap } = Theme.coinCounter;
        const larguraBase = this.icone.displayWidth + iconGap + this.texto.displayWidth + (paddingX * 2);
        return larguraBase * this.scaleX;
    }
}