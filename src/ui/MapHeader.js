import Phaser from 'phaser';
import { Theme } from '../config/Theme';
import { calcularEscalaResponsiva } from '../utils/responsiveScale';

export class MapHeader extends Phaser.GameObjects.Container {
    constructor(scene, x, y, faseAtual = 1, nomeFase = 'Carregando...', totalFases = 1) {
        super(scene, x, y);
        this.scene = scene;
        this.faseAtual = faseAtual;
        this.nomeFase = nomeFase;
        this.totalFases = totalFases;

        this.bg = scene.add.graphics();
        this.bgChamada = scene.add.graphics(); // ← novo, fundo só do "Vamos jogar!"

        this.iconeCasa = scene.add.image(0, 0, 'spr_icon_map_header')
            .setOrigin(0, 0.5)
            .setScale(Theme.mapHeader.iconScale);

        this.textoChamada = scene.add.text(0, 0, 'Vamos jogar!', Theme.textStyles.caption)
            .setOrigin(0, 0.5);

        this.textoFase = scene.add.text(0, 0, `Fase atual: ${this.nomeFase}`, Theme.textStyles.subtitle)
            .setOrigin(0, 0.5);

        this.textoProgresso = scene.add.text(0, 0, `${this.faseAtual}/${this.totalFases} fases jogadas`, Theme.textStyles.caption)
            .setOrigin(0, 0.5)
            .setAlpha(Theme.mapHeader.progressoAlpha);

        // bgChamada precisa vir ANTES de textoChamada, pra ficar atrás dele
        this.add([this.bg, this.iconeCasa, this.bgChamada, this.textoChamada, this.textoFase, this.textoProgresso]);

        this.ajustarEscalaContainer();
        this.desenharFundo();
        scene.add.existing(this);
    }

    ajustarEscalaContainer() {
        const larguraAtual = this.scene.scale.width;
        const escalaGeral = calcularEscalaResponsiva(larguraAtual, {
            larguraBase: Theme.hudPanel.scaleBaseWidth,
            min: Theme.mapHeader.scaleMin,
            max: Theme.mapHeader.scaleMax,
        });
        this.setScale(escalaGeral);
    }

    desenharFundo() {
        this.bg.clear();
        this.bgChamada.clear();

        const { paddingX, paddingY, gapEntreLinhas, gapIconeTextos, chamadaBadge } = Theme.mapHeader;
        const { cornerRadius, borderWidth, borderColor, bgColor } = Theme.hudPanel;
        const larguraIcone = this.iconeCasa ? this.iconeCasa.displayWidth : 0;

        const larguraTextos = Math.max(
            this.textoChamada.displayWidth,
            this.textoFase.displayWidth,
            this.textoProgresso.displayWidth
        );

        const larguraConteudo = larguraIcone + gapIconeTextos + larguraTextos;
        const larguraTotal = larguraConteudo + (paddingX * 2);

        const alturaTextos =
            this.textoChamada.displayHeight +
            this.textoFase.displayHeight +
            this.textoProgresso.displayHeight +
            (gapEntreLinhas * 2);

        const alturaTotal = Math.max(alturaTextos, this.iconeCasa.displayHeight) + (paddingY * 2);
        const x = -paddingX;
        const y = -alturaTotal / 2;

        this.iconeCasa.setPosition(0, 0);

        const posXTextos = larguraIcone + gapIconeTextos;
        const linha1Y = -alturaTextos / 2 + (this.textoChamada.displayHeight / 2);
        const linha2Y = linha1Y + (this.textoChamada.displayHeight / 2) + gapEntreLinhas + (this.textoFase.displayHeight / 2);
        const linha3Y = linha2Y + (this.textoFase.displayHeight / 2) + gapEntreLinhas + (this.textoProgresso.displayHeight / 2);

        this.textoChamada.setPosition(posXTextos, linha1Y);
        this.textoFase.setPosition(posXTextos, linha2Y);
        this.textoProgresso.setPosition(posXTextos, linha3Y);
        this.bg.lineStyle(borderWidth, borderColor, 1);
        this.bg.fillStyle(bgColor, 1);
        this.bg.fillRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);
        this.bg.strokeRoundedRect(x, y, larguraTotal, alturaTotal, cornerRadius);

        const badgeX = this.textoChamada.x - chamadaBadge.paddingX;  
        const badgeY = this.textoChamada.y - (this.textoChamada.displayHeight / 2) - chamadaBadge.paddingY;
        const badgeLargura = this.textoChamada.displayWidth + (chamadaBadge.paddingX * 2);
        const badgeAltura = this.textoChamada.displayHeight + (chamadaBadge.paddingY * 2);

        this.bgChamada.fillStyle(chamadaBadge.bgColor, 1);
        this.bgChamada.fillRoundedRect(badgeX, badgeY, badgeLargura, badgeAltura, chamadaBadge.cornerRadius);
    }

    atualizar(faseAtual, nomeFase, totalFases) {
        this.faseAtual = faseAtual;
        this.nomeFase = nomeFase;
        this.totalFases = totalFases;
        this.textoFase.setText(`Fase atual: ${this.nomeFase}`);
        this.textoProgresso.setText(`${this.faseAtual}/${this.totalFases} fases jogadas`);
        this.ajustarEscalaContainer();
        this.desenharFundo();
    }
}