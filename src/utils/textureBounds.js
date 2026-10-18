const cache = new Map();

export function obterBBox(scene, chave) {
    if (cache.has(chave)) return cache.get(chave);
    if (!scene.textures.exists(chave)) return null;

    const img = scene.textures.get(chave).getSourceImage();
    const w = img.width;
    const h = img.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    cache.set(chave, bbox);
    return bbox;
}