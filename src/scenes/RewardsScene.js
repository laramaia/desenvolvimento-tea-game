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

    // ---------- Contorno visível (sem transparência) de cada PNG ----------
    // x1 e y1 são exclusivos (primeiro pixel fora do contorno).

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

    // Gera o ícone de cada card recortando o espaço transparente da peça.
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

    // ---------- Interface ----------

    criarBotaoVoltar() {
        this.voltarBg = this.add.graphics().setDepth(25).setScrollFactor(0);

        this.voltarTxt = this.add.text(0, 0, '‹ Voltar', Theme.textStyles.title)
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
            .setPosition(larguraSidebar + (width - larguraSidebar) / 2, height * 0.92)
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
        const tam = Phaser.Math.Clamp(Math.min(height * 0.2, larguraCat / 6.2), 56, 140);
        const gap = tam * 0.12;
        const porLinha = Math.max(1, Math.floor((larguraCat + gap) / (tam + gap)));
        const fonteTitulo = Math.round(tam * 0.28);

        let y = height * 0.14;

        CATEGORIAS.forEach((cat) => {
            this.registrar(
                this.add.text(x0, y, cat.titulo, {
                    ...Theme.textStyles.button,
                    fontSize: `${fonteTitulo}px`,
                }).setDepth(10)
            );
            y += fonteTitulo * 1.5;

            cat.itens.forEach((item, i) => {
                const col = i % porLinha;
                const lin = Math.floor(i / porLinha);
                this.desenharCard(cat, item, x0 + col * (tam + gap), y + lin * (tam + gap), tam);
            });

            const linhas = Math.ceil(cat.itens.length / porLinha);
            y += linhas * (tam + gap) + tam * 0.2;
        });

        this.scrollMax = Math.max(0, y + margem - height);
        const cam = this.cameras.main;
        cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, this.scrollMax);
    }

    // ---------- Avatar ----------

    // Ajuste da camada = padrão da categoria + ajuste do item (sem o campo 'rosto')
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

        // k = tamanho de 1 pixel do PNG do corpo na tela
        const larguraCorpo = corpo.x1 - corpo.x0;
        const alturaCorpo = corpo.y1 - corpo.y0;
        const k = Math.min((w * 0.88) / larguraCorpo, (h * 0.88) / alturaCorpo);

        // Canto superior esquerdo do PNG do corpo na tela (corpo centralizado no painel)
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

        // Coloca uma peça: o contorno visível dela é ancorado no ponto (a.x, a.y) do corpo
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

    // ---------- Cards ----------

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