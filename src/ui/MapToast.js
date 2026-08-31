import Phaser from 'phaser';
import { Theme } from '../config/Theme';
import { calcularEscalaResponsiva } from '../utils/responsiveScale';

export class MapToast extends Phaser.GameObjects.Container {
    constructor(scene, x, y, texto = 'Complete as atividades para ganhar estrelas e desbloquear novas fases!') {
        super(scene, x, y);
        this.scene = scene;
        this.textoMensagem = texto;
        
        this.bg = scene.add.graphics();
        this.iconeFooter = scene.add.image(0, 0, 'spr_icon_map_footer')
            .setOrigin(0, 0.5)
            .setScale(Theme.toast.iconScale);

        this.texto = scene.add.text(0, 0, this.textoMensagem, Theme.textStyles.subtitle)
            .setOrigin(0, 0.5);

        this.add([this.bg, this.iconeFooter, this.texto]);
        this.ajustarEscalaContainer();
        this.desenharFundo();
        scene.add.existing(this);
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

    desenharFundo(larguraMaxDisponivel = null) {
        this.texto.setWordWrapWidth(null);

        const { paddingX, paddingY, gapIconeTextos, bgColor } = Theme.toast;
        const { cornerRadius, borderWidth, borderColor } = Theme.hudPanel;

        const larguraIcone = this.iconeFooter ? this.iconeFooter.displayWidth : 0;
        let larguraTexto = this.texto.displayWidth;

        if (larguraMaxDisponivel) {
            const limiteLarguraContainer = larguraMaxDisponivel / this.scaleX;
            const limiteTexto = limiteLarguraContainer - larguraIcone - gapIconeTextos - (paddingX * 2);

            if (larguraTexto > limiteTexto && limiteTexto > 50) {
                this.texto.setWordWrapWidth(limiteTexto);
                larguraTexto = this.texto.displayWidth;
            }
        }

        const larguraConteudo = larguraIcone + gapIconeTextos + larguraTexto;
        const larguraTotal = larguraConteudo + (paddingX * 2);
        const alturaTotal = Math.max(this.texto.displayHeight, this.iconeFooter.displayHeight) + (paddingY * 2);
        const x = -larguraTotal / 2;
        const y = -alturaTotal / 2;
        const inicioConteudoX = x + paddingX;
        this.iconeFooter.setPosition(inicioConteudoX, 0);
        this.texto.setPosition(inicioConteudoX + larguraIcone + gapIconeTextos, 0);
        this.bg.clear();
        this.bg.lineStyle(borderWidth, borderColor, 1);
        this.bg.fillStyle(bgColor, 1);
        this.bg.fillRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
    }

    atualizarTexto(novoTexto) {
        this.textoMensagem = novoTexto;
        this.texto.setText(this.textoMensagem);
        this.ajustarEscalaContainer();
        this.desenharFundo();
    }
}