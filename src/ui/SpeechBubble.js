import { GameState } from '../state/GameState';

export class SpeechBubble {
    constructor(scene, { aoTocar }) {
        this.scene = scene;
        this.escala = 1;
        this.tween = null;
        this.img = scene.add.image(0, 0, 'balao-fala')
            .setOrigin(0.5, 1)
            .setDepth(12)
            .setInteractive({ useHandCursor: true });
        this.img.on('pointerdown', () => aoTocar?.());
    }

    posicionar(x, y, largura) {
        this.parar();
        this.escala = largura / this.img.width;
        this.img.setScale(this.escala).setPosition(x, y);
    }

    iniciar() {
        if (GameState.settings.reduceMotion) return;
        this.parar();
        this.tween = this.scene.tweens.add({
            targets: this.img,
            scale: this.escala * 1.04,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    parar() {
        this.tween?.stop();
        this.tween = null;
        this.img.setScale(this.escala);
    }

    destroy() {
        this.parar();
        this.img.destroy();
    }
}