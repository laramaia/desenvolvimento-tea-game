import Phaser from 'phaser';
import { Theme } from '../config/Theme';

export class ErrorPopup extends Phaser.GameObjects.Container {
    constructor(scene, message) {
        const centerX = scene.scale.width / 2;
        const centerY = scene.scale.height / 2;

        super(scene, centerX, centerY);
        this.scene = scene;

        const { widthRatio, heightRatio, radius, bgColor, borderColor, borderWidth, textColor, fontSize } = Theme.popup;
        const width = scene.scale.width * widthRatio;
        const height = scene.scale.height * heightRatio;
        const bg = scene.add.graphics();

        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
        bg.lineStyle(borderWidth, borderColor, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
        this.add(bg);

        const texto = scene.add.text(0, 0, message, {
            fontSize,
            color: textColor,
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 60 },
        }).setOrigin(0.5);
        this.add(texto);

        scene.add.existing(this);
        this.setDepth(1000);
    }
}