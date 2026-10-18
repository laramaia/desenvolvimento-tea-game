import Phaser from 'phaser';
import { Theme } from '../../config/Theme';

export class OptionButton extends Phaser.GameObjects.Container {
    constructor(scene, texto, { largura, altura, aoClicar }) {
        super(scene, 0, 0);
        const cfg = Theme.optionCard;

        this.largura = largura;
        this.estado = 'normal'; 

        this.bg = scene.add.graphics();
        this.texto = scene.add.text(0, 0, texto, {
            ...Theme.textStyles.button,
            fontFamily: Theme.fonts.family,
            fontSize: `${Math.round(altura * cfg.fontSizeRatio)}px`,
            align: 'center',
            wordWrap: { width: largura * 0.9 },
        }).setOrigin(0.5);

        this.altura = Math.max(altura, this.texto.height + altura * 0.5);

        this.add([this.bg, this.texto]);
        this.setSize(largura, this.altura);
        this.setInteractive({ useHandCursor: true });

        this.on('pointerover', () => this.estado === 'normal' && this.desenhar(cfg.hoverColor));
        this.on('pointerout', () => this.estado === 'normal' && this.desenhar(cfg.bgColor));
        this.on('pointerdown', aoClicar);

        this.desenhar(cfg.bgColor);
        scene.add.existing(this);
    }

    desenhar(cor) {
        this.bg.clear();
        this.bg.fillStyle(cor, 1);
        this.bg.fillRoundedRect(
            -this.largura / 2,
            -this.altura / 2,
            this.largura,
            this.altura,
            Theme.optionCard.cornerRadius
        );
    }

    marcar(correta) {
        this.estado = correta ? 'correta' : 'errada';
        this.desenhar(correta ? Theme.colors.hex.success : Theme.colors.hex.error);
    }

    bloquear() {
        this.disableInteractive();
    }
}