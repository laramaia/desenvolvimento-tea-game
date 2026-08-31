import Phaser from 'phaser';
import { Theme } from '../config/Theme';
import { calcularEscalaResponsiva } from '../utils/responsiveScale';

export class ErrorToast extends Phaser.GameObjects.Container {
    constructor(scene, message) {
        const centerX = scene.scale.width / 2;
        const centerY = scene.scale.height / 2;
        super(scene, centerX, centerY);
        this.scene = scene;
        this.mensagem = message;
        this.bg = scene.add.graphics();
        this.texto = scene.add.text(0, 0, this.mensagem, {
            ...Theme.textStyles.subtitle,
            wordWrap: { width: scene.scale.width * 0.6 },
        }).setOrigin(0.5);
        this.add([this.bg, this.texto]);
        this.ajustarEscalaContainer();
        this.desenharFundo();
        scene.add.existing(this);
        this.setDepth(1000);
        this.agendarAutoDismiss();
    }

    ajustarEscalaContainer() {
        const larguraAtual = this.scene.scale.width;
        const escalaGeral = calcularEscalaResponsiva(larguraAtual, {
            larguraBase: Theme.hudPanel.scaleBaseWidth,
            min: Theme.toast.scaleMin,
            max: Theme.toast.scaleMax,
        });
        this.setScale(escalaGeral);
    }

    desenharFundo() {
        const { paddingX, paddingY, bgColor } = Theme.toast;
        const { cornerRadius, borderWidth, borderColor } = Theme.hudPanel;
        const larguraTotal = this.texto.displayWidth + (paddingX * 2);
        const alturaTotal = this.texto.displayHeight + (paddingY * 2);
        const x = -larguraTotal / 2;
        const y = -alturaTotal / 2;
        this.texto.setPosition(0, 0);
        this.bg.clear();
        this.bg.lineStyle(borderWidth, borderColor, 1);
        this.bg.fillStyle(bgColor, 1);
        this.bg.fillRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
        this.bg.strokeRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
    }

    agendarAutoDismiss() {
        this.scene.time.delayedCall(Theme.toast.autoDismissMs ?? 10000, () => {
            this.fecharComFade();
        });
    }

    fecharComFade() {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 400,
            onComplete: () => this.destroy(),
        });
    }
}