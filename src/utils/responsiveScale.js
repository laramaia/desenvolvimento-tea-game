import Phaser from 'phaser';
import { Theme } from '../config/Theme';

export function calcularEscalaResponsiva(larguraTela, { min = 0.5, max = 1.4, larguraBase = Theme.responsive.baseWidth } = {}) {
    let escala = larguraTela / larguraBase;
    return Phaser.Math.Clamp(escala, min, max);
}