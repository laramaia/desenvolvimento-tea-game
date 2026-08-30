import Phaser from 'phaser';
import { Theme } from '../config/Theme';

const spriteKeys = {
    locked: 'spr_level_node_locked',
    completed: 'spr_level_node_completed',
    current: 'spr_level_node_current',
    special: 'spr_level_node_special'
};

export class LevelNode extends Phaser.GameObjects.Container {
    constructor(scene, x, y, levelId, status = 'locked', onSelect = null) {
        super(scene, x, y);
        this.scene = scene;
        this.levelId = levelId;
        this.status = status;
        this.onSelect = onSelect;
        this.baseScale = 1;

        const textureKey = spriteKeys[status] || spriteKeys.locked;

        this.sprite = this.scene.add.image(0, 0, textureKey);
        this.add(this.sprite);

        this.atualizarEscala();

        if (this.onSelect) {
            this.configurarInteracao();
        }

        if (this.status === 'locked') {
            this.setAlpha(Theme.levelNode.lockedAlpha ?? 1);
        }

        scene.add.existing(this);
    }

    configurarInteracao() {
        this.sprite.setInteractive({ useHandCursor: true });

        this.sprite.on('pointerdown', (pointer, localX, localY, event) => {
            if (event) event.stopPropagation();
            this.onSelect(this.levelId);
        });

        this.sprite.on('pointerover', () => this.aplicarHover());
        this.sprite.on('pointerout', () => this.removerHover());
    }

    aplicarHover() {
        const hoverMult = Theme.levelNode.hoverMultiplier || 1.1;
        this.setScale(this.baseScale * hoverMult);
    }

    removerHover() {
        this.setScale(this.baseScale);
    }

    atualizarEscala() {
        const larguraAtual = this.scene.scale.width;
        const alturaAtual = this.scene.scale.height;
        const ratioX = larguraAtual / 1280;
        const ratioY = alturaAtual / 720;
        const menorProporcao = Math.min(ratioX, ratioY);

        // Verifica tamanho da tela
        if (larguraAtual < 1280 || alturaAtual < 720) {
            this.baseScale = Phaser.Math.Clamp(menorProporcao * 0.8, 0.4, 0.65);
        } else {
            this.baseScale = Phaser.Math.Clamp(menorProporcao, 0.65, 0.8);
        }

        this.setScale(this.baseScale);
    }
}