import {
    CATEGORIAS,
    CAMINHOS_ROSTO,
    BASE_ASSETS,
    CAMINHO_CORPO,
} from '../../config/AvatarCatalog';

export function carregarAssetsAvatar(scene) {
    scene.load.image('avatar_body', CAMINHO_CORPO);

    Object.entries(CAMINHOS_ROSTO).forEach(([id, caminho]) => {
        scene.load.image(`rosto_${id}`, caminho);
    });

    CATEGORIAS.forEach((cat) => {
        cat.itens.forEach((item) => {
            scene.load.image(item.id, `${BASE_ASSETS}/${cat.pasta}/${item.id}.png`);
        });
    });
}