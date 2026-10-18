import Phaser from 'phaser';
import { Theme } from '../../config/Theme';
import { obterBBox } from '../../utils/textureBounds';
import {
    CATEGORIAS,
    ORDEM_CAMADAS,
    AJUSTES_CAMADAS,
    ROSTO_PADRAO,
} from '../../config/AvatarCatalog';

const COR_PAINEL = 0x5e8ce0;
const COR_BORDA = 0x2f7fe0;

export class AvatarView extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} estado  
     * @param {{comFundo?: boolean}} opcoes
     */
    constructor(scene, estado, { comFundo = true } = {}) {
        super(scene, 0, 0);
        this.estado = estado;
        this.comFundo = comFundo;
        this.largura = 0;
        this.altura = 0;
        scene.add.existing(this);
    }

    definirArea(x, y, largura, altura) {
        this.setPosition(x, y);
        this.largura = largura;
        this.altura = altura;
        this.redesenhar();
        return this;
    }

    definirEstado(estado) {
        this.estado = estado;
        this.redesenhar();
        return this;
    }

    redesenhar() {
        this.removeAll(true);
        if (this.largura <= 0 || this.altura <= 0) return;

        if (this.comFundo) this.desenharFundo();

        const corpo = obterBBox(this.scene, 'avatar_body');
        if (!corpo) {
            this.add(this.criarTextoErro());
            return;
        }

        const w = this.largura;
        const h = this.altura;
        const k = Math.min(
            (w * 0.88) / (corpo.x1 - corpo.x0),
            (h * 0.88) / (corpo.y1 - corpo.y0)
        );

        const origemX = w / 2 - ((corpo.x0 + corpo.x1) / 2) * k;
        const origemY = h / 2 - ((corpo.y0 + corpo.y1) / 2) * k;

        this.add(
            this.scene.add.image(origemX, origemY, 'avatar_body')
                .setOrigin(0, 0)
                .setScale(k)
        );

        ORDEM_CAMADAS.forEach((catId) => {
            if (catId === 'rosto') {
                this.colocarCamada(`rosto_${this.rostoEquipado()}`, AJUSTES_CAMADAS.rosto, k, origemX, origemY);
                return;
            }
            const itemId = this.estado.equipados[catId];
            this.colocarCamada(itemId, this.ajusteDe(catId, itemId), k, origemX, origemY);
        });
    }

    colocarCamada(chave, ajuste, k, origemX, origemY) {
        const b = obterBBox(this.scene, chave);
        if (!b) return;

        const s = k * ajuste.escala;
        const px = origemX + ajuste.x * k - ((b.x0 + b.x1) / 2) * s;
        const py = ajuste.ancora === 'bottom'
            ? origemY + ajuste.y * k - b.y1 * s
            : origemY + ajuste.y * k - b.y0 * s;

        this.add(this.scene.add.image(px, py, chave).setOrigin(0, 0).setScale(s));
    }

    ajusteDe(catId, itemId) {
        const base = AJUSTES_CAMADAS[catId];
        const cat = CATEGORIAS.find((c) => c.id === catId);
        const it = cat?.itens.find((i) => i.id === itemId);
        const { rosto, ...extra } = it?.ajuste ?? {};
        return { ...base, ...extra };
    }

    rostoEquipado() {
        const cat = CATEGORIAS.find((c) => c.id === 'cabelo');
        const it = cat.itens.find((i) => i.id === this.estado.equipados.cabelo);
        return it?.ajuste?.rosto ?? ROSTO_PADRAO;
    }

    desenharFundo() {
        const g = this.scene.add.graphics();
        g.fillStyle(COR_PAINEL, 1);
        g.fillRoundedRect(0, 0, this.largura, this.altura, 12);
        g.lineStyle(3, COR_BORDA, 1);
        g.strokeRoundedRect(0, 0, this.largura, this.altura, 12);
        this.add(g);
    }

    criarTextoErro() {
        return this.scene.add.text(
            this.largura / 2,
            this.altura / 2,
            'Avatar\n(imagem não encontrada)',
            { ...Theme.textStyles.subtitle, align: 'center', wordWrap: { width: this.largura * 0.9 } }
        ).setOrigin(0.5);
    }
}