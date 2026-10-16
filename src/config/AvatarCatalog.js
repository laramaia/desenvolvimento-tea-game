export const BASE_ASSETS = '/assets/sprites/avatar';
export const CAMINHO_CORPO = `${BASE_ASSETS}/body/body-default.png`;
export const MOEDAS_POR_ESTRELA = 10;
export const CAMINHOS_ROSTO = {
    'face-01': `${BASE_ASSETS}/face/face-boy.png`,
    'face-02': `${BASE_ASSETS}/face/face-girl.png`,
};
export const ROSTO_PADRAO = 'face-01';

export const ORDEM_CAMADAS = ['calça', 'sapato', 'blusa', 'rosto', 'cabelo'];

export const AJUSTES_CAMADAS = {
    rosto:  { ancora: 'top',    x: 130, y: 95,  escala: 0.80 },
    cabelo: { ancora: 'top',    x: 130, y: 25,  escala: 1.10 },
    blusa:  { ancora: 'top',    x: 129, y: 194, escala: 1.03 },
    calça:  { ancora: 'top',    x: 129, y: 298, escala: 1.14 },
    sapato: { ancora: 'bottom', x: 129, y: 511, escala: 0.95 },
};

const item = (id, preco = 0, ajuste = null) => ({ id, preco, ajuste });

export const CATEGORIAS = [
    {
        id: 'cabelo',
        pasta: 'hair',
        titulo: 'Cabelos',
        itens: [
            item('hair-01', 0, {rosto: 'face-01' }),
            item('hair-02' , 0, { escala: 1.18, x: 129, y: 25, rosto: 'face-01' }),
            item('hair-03' , 0, { escala: 1.10, x: 132, y: 22, rosto: 'face-01' }),
            item('hair-04' , 0, { escala: 1.18, x: 135, y: 25, rosto: 'face-01' }),
            item('hair-05-long', 0, { escala: 1.40, x: 129, y: 23, rosto: 'face-02' }),
            item('hair-06-long', 0, { escala: 1.40, x: 129, y: 29, rosto: 'face-02' }),
        ],
    },
    {
        id: 'blusa',
        pasta: 'top',
        titulo: 'Blusas',
        itens: [
            item('top-tshirt-blue', 0, { escala: 1.08 }),
            item('top-tshirt-white', 0, { escala: 1.05 }),
            item('top-cat-sweart-red', 30),
            item('top-sweart-green', 30, { escala: 1.15, y: 182 }),
            item('top-sweart-orange', 30, { escala: 1.15, y: 182 }),
        ],
    },
    {
        id: 'calça',
        pasta: 'bottom',
        titulo: 'Calças',
        itens: [
            item('bottom-gray'),
            item('bottom-green', 0, { escala: 0.90 }),
            item('bottom-jeans-blue', 30),
        ],
    },
    {
        id: 'sapato',
        pasta: 'shoes',
        titulo: 'Sapatos',
        itens: [
            item('shoes-sneakers-red', 0,{ escala: 1.02}),
            item('shoes-sneakers-black'),
            item('shoes-boots-brown', 30, { escala: 0.92}),
        ],
    },
];