import { GameState } from './GameState';
import { LevelService } from '../services/LevelService';
import { CATEGORIAS, MOEDAS_POR_ESTRELA } from '../config/AvatarCatalog';

export class AvatarState {
    static chave() {
        return `avatar_${GameState.pacienteId ?? 'anonimo'}`;
    }

    static padrao() {
        const equipados = {};
        CATEGORIAS.forEach((cat) => {
            equipados[cat.id] = cat.itens[0].id;
        });
        return { equipados, comprados: [] };
    }

    static carregar() {
        const base = this.padrao();

        try {
            const bruto = localStorage.getItem(this.chave());
            if (!bruto) return base;

            const salvo = JSON.parse(bruto);
            const equipados = { ...base.equipados, ...(salvo.equipados ?? {}) };

            CATEGORIAS.forEach((cat) => {
                if (!cat.itens.some((i) => i.id === equipados[cat.id])) {
                    equipados[cat.id] = cat.itens[0].id;
                }
            });

            return {
                equipados,
                comprados: Array.isArray(salvo.comprados) ? salvo.comprados : [],
            };
        } catch (error) {
            console.warn('Não foi possível ler o avatar salvo.', error);
            return base;
        }
    }

    static salvar(estado) {
        try {
            localStorage.setItem(this.chave(), JSON.stringify(estado));
        } catch (error) {
            console.warn('Não foi possível salvar o avatar.', error);
        }
    }

    static possui(estado, item) {
        return item.preco === 0 || estado.comprados.includes(item.id);
    }

    static gasto(estado) {
        const precos = new Map();
        CATEGORIAS.forEach((c) => c.itens.forEach((i) => precos.set(i.id, i.preco)));
        return estado.comprados.reduce((soma, id) => soma + (precos.get(id) ?? 0), 0);
    }

    static async getEstrelas() {
        try {
            const historico = await LevelService.getProgresso();

            const melhorPorFase = new Map();
            historico.forEach((h) => {
                const atual = melhorPorFase.get(h.faseId) ?? 0;
                melhorPorFase.set(h.faseId, Math.max(atual, h.estrelasGanhas ?? 0));
            });

            return [...melhorPorFase.values()].reduce((a, b) => a + b, 0);
        } catch (error) {
            console.warn('Não foi possível calcular as estrelas.', error);
            return 0;
        }
    }

    static moedas(estrelas, estado) {
        return Math.max(0, estrelas * MOEDAS_POR_ESTRELA - this.gasto(estado));
    }

    
}