import Phaser from 'phaser';
import { Theme } from '../../config/Theme';

export class SidebarButton extends Phaser.GameObjects.Container {
    constructor(scene, x, y, texto, onClick = null) {
        super(scene, x, y);
        this.scene = scene;
        this.textoConteudo = texto;
        this.onClick = onClick;

        this.fundo = this.scene.add.graphics();
        this.texto = this.scene.add.text(0, 0, this.textoConteudo, Theme.textStyles.button).setOrigin(0.5);

        this.add([this.fundo, this.texto]);

        this.corFundo = Theme.colors.hex.primaryDark;
        this.corHover = Theme.colors.hex.primaryHover;

        this.on('pointerover', () => this.desenharFundo(this.corHover));
        this.on('pointerout', () => this.desenharFundo(this.corFundo));
        this.on('pointerdown', () => {
            if (this.onClick) this.onClick();
        });

        scene.add.existing(this);
    }

    desenharFundo(cor) {
        this.fundo.clear();

        const x = -this.largura / 2;
        const y = -this.altura / 2;
        const radius = Theme.sidebar.borderRadius;
        const shadow = Theme.shadows.default;

        for (let i = shadow.blurPasses; i > 0; i--) {
            const opacity = (shadow.alpha / shadow.blurPasses) * (i / shadow.blurPasses);
            const spread = i * 1.2;

            this.fundo.fillStyle(shadow.color, opacity);
            this.fundo.fillRoundedRect(
                x - spread / 2,
                y + shadow.offsetY - spread / 2,
                this.largura + spread,
                this.altura + spread,
                radius + spread / 2
            );
        }

        this.fundo.fillStyle(cor, 1);
        this.fundo.fillRoundedRect(x, y, this.largura, this.altura, radius);
    }

    redimensionar(larguraSidebar) {
        this.largura = larguraSidebar * Theme.sidebar.buttonWidthRatio;
        this.altura = larguraSidebar * Theme.sidebar.buttonHeightRatio;

        this.setSize(this.largura, this.altura);
        this.setInteractive({ useHandCursor: true });
        this.desenharFundo(this.corFundo);
    }
}