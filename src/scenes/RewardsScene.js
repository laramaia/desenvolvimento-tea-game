import Phaser from 'phaser';
import { Sidebar } from '../ui/Sidebar/Sidebar';
import { CoinCounter } from '../ui/CoinCounter';
import { Theme } from '../config/Theme';
import { AvatarState } from '../state/AvatarState';
import {
    CATEGORIAS,
    ORDEM_CAMADAS,
    AJUSTES_CAMADAS,
    CAMINHOS_ROSTO,
    ROSTO_PADRAO,
    BASE_ASSETS,
    CAMINHO_CORPO,
} from '../config/AvatarCatalog';

const COR_PAINEL_AVATAR = 0x5e8ce0;
const COR_BORDA_AVATAR = 0x2f7fe0;
const COR_CARD = 0x5b8de6;
const COR_CARD_BLOQUEADO = 0x203b6e;
const COR_SELECIONADO = 0xffffff;

const VISIVEIS_MAX = 5;

export class RewardsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RewardsScene' });
    }

    init() {
        this.estado = AvatarState.carregar();
        this.estrelas = 0;
        this.conteudo = [];
        this.scrollMax = 0;
        this.encerrada = false;
        this.bboxCache = {};
        this.indices = {};
        this.animacao = null;
        this.tweensEntrada = [];
    }

    preload() {
        this.load.on('loaderror', (file) => {
            console.warn('Não encontrei o arquivo:', file.src);
        });

        this.load.image('avatar_body', CAMINHO_CORPO);

        Object.entries(CAMINHOS_ROSTO).forEach(([id, caminho]) => {
            this.load.image(`rosto_${id}`, caminho);
        });

        CATEGORIAS.forEach((cat) => {
            cat.itens.forEach((item) => {
                this.load.image(item.id, `${BASE_ASSETS}/${cat.pasta}/${item.id}.png`);
            });
        });
    }

    async create() {
        this.cameras.main.scrollY = 0;

        this.bg = this.add.image(0, 0, Theme.backgrounds.map)
            .setOrigin(0, 0)
            .setDepth(0)
            .setScrollFactor(0);

        this.sidebar = new Sidebar(this, {
            Jornada: () => this.scene.start('MapScene'),
        });
        this.sidebar.container.setDepth(20).setScrollFactor(0);

        this.coinCounter = new CoinCounter(this, 0, 0, 0);
        this.coinCounter.setDepth(25).setScrollFactor(0);

        this.criarBotaoVoltar();
        this.criarAviso();

        this.aoRedimensionar = () => this.layout();
        this.aoRolar = (pointer, objetos, dx, dy) => {
            const cam = this.cameras.main;
            cam.scrollY = Phaser.Math.Clamp(cam.scrollY + dy * 0.6, 0, this.scrollMax);
        };

        this.scale.on('resize', this.aoRedimensionar, this);
        this.input.on('wheel', this.aoRolar, this);

        this.events.once('shutdown', () => {
            this.encerrada = true;
            this.scale.off('resize', this.aoRedimensionar, this);
            this.input.off('wheel', this.aoRolar, this);
        });

        this.gerarIcones();
        this.layout();

        this.estrelas = await AvatarState.getEstrelas();
        if (this.encerrada) return;

        this.atualizarMoedas();
    }

    obterBBox(chave) {
        if (this.bboxCache[chave]) return this.bboxCache[chave];
        if (!this.textures.exists(chave)) return null;

        const img = this.textures.get(chave).getSourceImage();
        const w = img.width;
        const h = img.height;

        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, w, h);

        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (data[(y * w + x) * 4 + 3] > 10) {
                    if (x < x0) x0 = x;
                    if (x > x1) x1 = x;
                    if (y < y0) y0 = y;
                    if (y > y1) y1 = y;
                }
            }
        }

        const bbox = x1 < 0
            ? { x0: 0, y0: 0, x1: w, y1: h, w, h }
            : { x0, y0, x1: x1 + 1, y1: y1 + 1, w, h };

        this.bboxCache[chave] = bbox;
        return bbox;
    }

    gerarIcones() {
        CATEGORIAS.forEach((cat) => {
            cat.itens.forEach((item) => {
                const chaveIcone = `${item.id}_icon`;
                if (this.textures.exists(chaveIcone) || !this.textures.exists(item.id)) return;

                const b = this.obterBBox(item.id);
                const img = this.textures.get(item.id).getSourceImage();
                const cw = b.x1 - b.x0;
                const ch = b.y1 - b.y0;

                const out = document.createElement('canvas');
                out.width = cw;
                out.height = ch;
                out.getContext('2d').drawImage(img, b.x0, b.y0, cw, ch, 0, 0, cw, ch);

                this.textures.addCanvas(chaveIcone, out);
            });
        });
    }


    criarBotaoVoltar() {
        this.voltarBg = this.add.graphics().setDepth(25).setScrollFactor(0);

        this.voltarTxt = this.add.text(0, 0, '‹ Voltar', Theme.textStyles.title)
            .setScale(0.7)    
            .setOrigin(0.5)
            .setDepth(26)
            .setScrollFactor(0);

        this.voltarZona = this.add.zone(0, 0, 10, 10)
            .setOrigin(0, 0)
            .setDepth(27)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });

        this.voltarZona.on('pointerdown', () => this.scene.start('MapScene'));
    }

    criarAviso() {
        this.aviso = this.add.text(0, 0, '', {
            ...Theme.textStyles.backButton,
            fontSize: '20px',
        })
            .setOrigin(0.5)
            .setDepth(40)
            .setScrollFactor(0)
            .setAlpha(0);
    }

    mostrarAviso(mensagem) {
        const { width, height, larguraSidebar } = this.geometria;

        this.tweens.killTweensOf(this.aviso);
        this.aviso
            .setText(mensagem)
            .setPosition(larguraSidebar + (width - larguraSidebar) / 2, height * 0.95)
            .setAlpha(1);

        this.tweens.add({
            targets: this.aviso,
            alpha: 0,
            delay: 1800,
            duration: 400,
        });
    }

    layout() {
        this.posicionarFixos();
        this.desenhar();
    }

    posicionarFixos() {
        const tamanho = this.scale.gameSize;
        const { width, height } = tamanho;

        this.bg.setDisplaySize(width, height);
        this.sidebar.redimensionar(tamanho);

        const larguraSidebar = this.sidebar.getLarguraAtual(tamanho);
        const margem = Math.max(16, width * 0.02);
        const centroY = height * 0.136;

        const vw = Phaser.Math.Clamp(width * 0.11, 110, 170);
        const vh = vw * 0.54;
        const vx = larguraSidebar + margem;
        const vy = centroY - vh / 2;

        const { cornerRadius, borderWidth, borderColor, bgColor } = Theme.hudPanel;
        this.voltarBg.clear();
        this.voltarBg.lineStyle(borderWidth, borderColor, 1);
        this.voltarBg.fillStyle(bgColor, 1);
        this.voltarBg.fillRoundedRect(vx, vy, vw, vh, cornerRadius);
        this.voltarBg.strokeRoundedRect(vx, vy, vw, vh, cornerRadius);

        this.voltarTxt
            .setFontSize(Math.round(vh * 0.4))
            .setPosition(vx + vw / 2, vy + vh / 2);
        this.voltarZona.setPosition(vx, vy).setSize(vw, vh);

        this.geometria = { width, height, larguraSidebar, margem, centroY, vx, vy, vh };
        this.posicionarMoedas();
    }

    posicionarMoedas() {
        const { width, margem, centroY } = this.geometria;
        this.coinCounter.ajustarEscalaContainer();
        this.coinCounter.setPosition(
            width - margem - this.coinCounter.getLarguraTotal(),
            centroY
        );
    }

    moedasDisponiveis() {
        return AvatarState.moedas(this.estrelas, this.estado);
    }

    atualizarMoedas() {
        this.coinCounter.atualizar(this.moedasDisponiveis());
        this.posicionarMoedas();
    }

    registrar(objeto) {
        this.conteudo.push(objeto);
        return objeto;
    }

    limparConteudo() {
        this.tweensEntrada.forEach((t) => t.stop());
        this.tweensEntrada = [];

        this.conteudo.forEach((obj) => obj.destroy());
        this.conteudo = [];
    }

    desenhar() {
        this.limparConteudo();

        const { width, height, margem, vx, vy, vh } = this.geometria;

        const painelX = vx;
        const painelY = vy + vh + margem * 0.6;
        const painelW = Phaser.Math.Clamp(width * 0.18, 130, 260);
        const painelH = Math.max(120, Math.min(painelW * 1.7, height - painelY - margem));
        this.desenharAvatar(painelX, painelY, painelW, painelH);

        const x0 = painelX + painelW + margem * 1.5;
        const larguraCat = width - margem - x0;
        const topoY = height * 0.14;
        const disponivel = height - topoY - margem;

        const tamPelaAltura = disponivel / (CATEGORIAS.length * 1.7);
        const tamPelaLargura = larguraCat / 5.5;
        const tam = Phaser.Math.Clamp(Math.min(tamPelaAltura, tamPelaLargura), 56, 150);

        const gap = tam * 0.12;
        const larguraSeta = Phaser.Math.Clamp(tam * 0.38, 28, 52);
        const gapSeta = tam * 0.1;

        const larguraArea = larguraCat - 2 * (larguraSeta + gapSeta);
        const visiveis = Phaser.Math.Clamp(
            Math.floor((larguraArea + gap) / (tam + gap)),
            1,
            VISIVEIS_MAX
        );

        const fonteTitulo = Math.round(tam * 0.26);

        let y = topoY;

        CATEGORIAS.forEach((cat) => {
            this.registrar(
                this.add.text(x0, y, cat.titulo, {
                    ...Theme.textStyles.button,
                    fontSize: `${fonteTitulo}px`,
                }).setDepth(10)
            );
            y += fonteTitulo * 1.5;

            this.desenharCarrossel(cat, { x0, y, tam, gap, larguraSeta, gapSeta, visiveis });

            y += tam + tam * 0.2 + tam * 0.1;
        });

        this.scrollMax = Math.max(0, y + margem - height);
        const cam = this.cameras.main;
        cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, this.scrollMax);
    }

    desenharCarrossel(cat, { x0, y, tam, gap, larguraSeta, gapSeta, visiveis }) {
        const total = cat.itens.length;
        const maxInicio = Math.max(0, total - visiveis);

        if (this.indices[cat.id] === undefined) {
            const equipado = Math.max(
                0,
                cat.itens.findIndex((i) => i.id === this.estado.equipados[cat.id])
            );
            this.indices[cat.id] = Math.floor(equipado / visiveis) * visiveis;
        }

        const inicio = Phaser.Math.Clamp(this.indices[cat.id], 0, maxInicio);
        this.indices[cat.id] = inicio;

        const itensX = x0 + larguraSeta + gapSeta;
        const usado = visiveis * tam + (visiveis - 1) * gap;

        const antes = this.conteudo.length;
        cat.itens.slice(inicio, inicio + visiveis).forEach((item, i) => {
            this.desenharCard(cat, item, itensX + i * (tam + gap), y, tam);
        });
        const cartoes = this.conteudo.slice(antes);

        if (this.animacao && this.animacao.catId === cat.id) {
            this.animarEntrada(cartoes, this.animacao.dir * tam * 0.5);
            this.animacao = null;
        }

        if (total <= visiveis) return;

        const cyCards = y + tam / 2;

        this.desenharSeta(
            -1,
            x0 + larguraSeta / 2,
            cyCards,
            larguraSeta,
            inicio > 0,
            () => this.mudarPagina(cat, -1, visiveis)
        );

        this.desenharSeta(
            1,
            itensX + usado + gapSeta + larguraSeta / 2,
            cyCards,
            larguraSeta,
            inicio < maxInicio,
            () => this.mudarPagina(cat, 1, visiveis)
        );

        this.desenharBolinhas(
            itensX + usado / 2,
            y + tam + tam * 0.12,
            tam,
            Math.ceil(total / visiveis),
            inicio >= maxInicio ? Math.ceil(total / visiveis) - 1 : Math.floor(inicio / visiveis)
        );
    }

    mudarPagina(cat, dir, visiveis) {
        const max = Math.max(0, cat.itens.length - visiveis);
        const atual = this.indices[cat.id] ?? 0;
        const novo = Phaser.Math.Clamp(atual + dir * visiveis, 0, max);
        if (novo === atual) return;

        this.indices[cat.id] = novo;
        this.animacao = { catId: cat.id, dir };

        this.time.delayedCall(0, () => {
            if (!this.encerrada) this.desenhar();
        });
    }

    animarEntrada(objetos, deslocamento) {
        const basesX = objetos.map((o) => o.x);
        const alfas = objetos.map((o) => o.alpha);

        objetos.forEach((o, i) => {
            o.x = basesX[i] + deslocamento;
            o.setAlpha(0);
        });

        const progresso = { t: 0 };
        const tween = this.tweens.add({
            targets: progresso,
            t: 1,
            duration: 240,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
                objetos.forEach((o, i) => {
                    if (!o.active) return;
                    o.x = basesX[i] + deslocamento * (1 - progresso.t);
                    o.setAlpha(alfas[i] * progresso.t);
                });
            },
        });
        this.tweensEntrada.push(tween);
    }

    desenharSeta(dir, cx, cy, diametro, ativa, aoClicar) {
        const r = diametro / 2;

        const g = this.registrar(this.add.graphics().setDepth(9));
        g.fillStyle(Theme.colors.hex.primary, 0.85);
        g.fillCircle(cx, cy, r);
        g.lineStyle(2, Theme.colors.hex.white, 1);
        g.strokeCircle(cx, cy, r);

        const ponta = cx + dir * r * 0.2;
        const base = cx - dir * r * 0.15;
        g.lineStyle(Math.max(2, r * 0.18), Theme.colors.hex.white, 1);
        g.beginPath();
        g.moveTo(base, cy - r * 0.4);
        g.lineTo(ponta, cy);
        g.lineTo(base, cy + r * 0.4);
        g.strokePath();

        if (!ativa) {
            g.setAlpha(0.3);
            return;
        }

        const zona = this.registrar(
            this.add.zone(cx - r, cy - r, diametro, diametro)
                .setOrigin(0, 0)
                .setDepth(12)
                .setInteractive({ useHandCursor: true })
        );
        zona.on('pointerdown', aoClicar);
    }

    desenharBolinhas(cx, cy, tam, quantidade, atual) {
        const raio = Math.max(4, tam * 0.04);
        const espaco = raio * 3.6;
        const inicioX = cx - ((quantidade - 1) * espaco) / 2;

        const g = this.registrar(this.add.graphics().setDepth(9));
        for (let i = 0; i < quantidade; i++) {
            const px = inicioX + i * espaco;
            if (i === atual) {
                g.fillStyle(Theme.colors.hex.white, 1);
                g.fillCircle(px, cy, raio);
            } else {
                g.lineStyle(2, Theme.colors.hex.white, 0.6);
                g.strokeCircle(px, cy, raio);
            }
        }
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

    desenharAvatar(x, y, w, h) {
        const g = this.registrar(this.add.graphics().setDepth(5).setScrollFactor(0));
        g.fillStyle(COR_PAINEL_AVATAR, 1);
        g.fillRoundedRect(x, y, w, h, 12);
        g.lineStyle(3, COR_BORDA_AVATAR, 1);
        g.strokeRoundedRect(x, y, w, h, 12);

        const cx = x + w / 2;
        const cy = y + h / 2;

        const corpo = this.obterBBox('avatar_body');
        if (!corpo) {
            this.registrar(
                this.add.text(cx, cy, 'Avatar\n(imagem não encontrada)', {
                    ...Theme.textStyles.subtitle,
                    align: 'center',
                    wordWrap: { width: w * 0.9 },
                })
                    .setOrigin(0.5)
                    .setDepth(6)
                    .setScrollFactor(0)
            );
            return;
        }

        const larguraCorpo = corpo.x1 - corpo.x0;
        const alturaCorpo = corpo.y1 - corpo.y0;
        const k = Math.min((w * 0.88) / larguraCorpo, (h * 0.88) / alturaCorpo);

        const origemX = cx - ((corpo.x0 + corpo.x1) / 2) * k;
        const origemY = cy - ((corpo.y0 + corpo.y1) / 2) * k;

        let prof = 6;

        this.registrar(
            this.add.image(origemX, origemY, 'avatar_body')
                .setOrigin(0, 0)
                .setScale(k)
                .setDepth(prof++)
                .setScrollFactor(0)
        );

        const colocar = (chave, a) => {
            const b = this.obterBBox(chave);
            if (!b) return;

            const s = k * a.escala;
            const px = origemX + a.x * k - ((b.x0 + b.x1) / 2) * s;
            const py = a.ancora === 'bottom'
                ? origemY + a.y * k - b.y1 * s
                : origemY + a.y * k - b.y0 * s;

            this.registrar(
                this.add.image(px, py, chave)
                    .setOrigin(0, 0)
                    .setScale(s)
                    .setDepth(prof++)
                    .setScrollFactor(0)
            );
        };

        ORDEM_CAMADAS.forEach((catId) => {
            if (catId === 'rosto') {
                colocar(`rosto_${this.rostoEquipado()}`, AJUSTES_CAMADAS.rosto);
                return;
            }

            const itemId = this.estado.equipados[catId];
            colocar(itemId, this.ajusteDe(catId, itemId));
        });
    }

    desenharCard(cat, item, x, y, tam) {
        const possui = AvatarState.possui(this.estado, item);
        const selecionado = this.estado.equipados[cat.id] === item.id;
        const raio = tam * 0.14;

        const g = this.registrar(this.add.graphics().setDepth(8));
        g.fillStyle(possui ? COR_CARD : COR_CARD_BLOQUEADO, 1);
        g.fillRoundedRect(x, y, tam, tam, raio);
        if (selecionado) {
            g.lineStyle(Math.max(3, tam * 0.045), COR_SELECIONADO, 1);
            g.strokeRoundedRect(x, y, tam, tam, raio);
        }

        const cx = x + tam / 2;
        const cy = y + tam / 2;
        const chaveIcone = `${item.id}_icon`;

        if (this.textures.exists(chaveIcone)) {
            const icone = this.registrar(this.add.image(cx, cy, chaveIcone).setDepth(9));
            icone.setScale(Math.min((tam * 0.8) / icone.width, (tam * 0.8) / icone.height));
            if (!possui) icone.setAlpha(0.3);
        } else {
            this.registrar(
                this.add.text(cx, cy, item.id, {
                    ...Theme.textStyles.caption,
                    fontSize: `${Math.round(tam * 0.16)}px`,
                    align: 'center',
                    wordWrap: { width: tam * 0.9 },
                })
                    .setOrigin(0.5)
                    .setDepth(9)
            );
        }

        if (!possui) this.desenharPreco(item.preco, cx, cy, tam);

        const zona = this.registrar(
            this.add.zone(x, y, tam, tam)
                .setOrigin(0, 0)
                .setDepth(12)
                .setInteractive({ useHandCursor: true })
        );
        zona.on('pointerdown', () => this.aoClicarItem(cat, item));
    }

    desenharPreco(preco, cx, cy, tam) {
        const texto = this.registrar(
            this.add.text(0, cy, `x${preco}`, {
                ...Theme.textStyles.button,
                fontSize: `${Math.round(tam * 0.24)}px`,
            })
                .setOrigin(0, 0.5)
                .setDepth(11)
        );

        if (!this.textures.exists('spr_icon_coin')) {
            texto.setOrigin(0.5).setX(cx);
            return;
        }

        const moeda = this.registrar(
            this.add.image(0, cy, 'spr_icon_coin').setOrigin(0, 0.5).setDepth(11)
        );
        moeda.setScale((tam * 0.3) / moeda.height);

        const folga = 4;
        const total = moeda.displayWidth + folga + texto.width;
        const inicio = cx - total / 2;
        moeda.setX(inicio);
        texto.setX(inicio + moeda.displayWidth + folga);
    }

    aoClicarItem(cat, item) {
        if (!AvatarState.possui(this.estado, item)) {
            const moedas = this.moedasDisponiveis();

            if (moedas < item.preco) {
                this.mostrarAviso(
                    `Faltam ${item.preco - moedas} moedas para desbloquear este item.`
                );
                return;
            }

            this.estado.comprados.push(item.id);
        }

        this.estado.equipados[cat.id] = item.id;
        AvatarState.salvar(this.estado);
        this.atualizarMoedas();

        this.time.delayedCall(0, () => {
            if (!this.encerrada) this.desenhar();
        });
    }
}