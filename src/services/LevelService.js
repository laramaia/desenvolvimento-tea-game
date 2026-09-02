import { ApiClient } from './ApiClient';
import { GameState } from '../state/GameState';

const CACHE_KEY_NODES = 'levels_cache';
const CACHE_KEY_FASES = 'fases_cache';

const POSICOES_MAPA = [
  { xRatio: 0.09, yRatio: 0.44 },
  { xRatio: 0.26, yRatio: 0.52 },
  { xRatio: 0.44, yRatio: 0.45 },
  { xRatio: 0.64, yRatio: 0.50 },
  { xRatio: 0.42, yRatio: 0.66 },
];

export class LevelService {
  static async getLevels() {
    try {
      const fases = await ApiClient.get('/Fase/listar');
      this.salvarCache(CACHE_KEY_FASES, fases);

      const progresso = await this.getProgresso();
      const levels = this.mapearParaLevelNodes(fases, progresso);

      this.salvarCache(CACHE_KEY_NODES, levels);
      return levels;
    } catch (error) {
      console.warn('Backend indisponível, usando cache local.', error);
      return this.lerCache(CACHE_KEY_NODES);
    }
  }

  static async getProgresso() {
    if (!GameState.pacienteId) return []; // sem paciente vinculado, ninguém desbloqueou nada ainda

    try {
      const resposta = await ApiClient.get(`/Jogo/progresso/paciente/${GameState.pacienteId}`);
      return resposta.historicoFases ?? [];
    } catch (error) {
      console.warn('Não foi possível buscar progresso do paciente.', error);
      return [];
    }
  }

  static mapearParaLevelNodes(fases, progresso) {
    const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
    const idsCompletados = new Set(progresso.map(p => p.faseId));

    let primeiraNaoCompletadaEncontrada = false;

    return fasesOrdenadas.map((fase, index) => {
      let status;

      if (idsCompletados.has(fase.faseId)) {
        status = 'completed';
      } else if (!primeiraNaoCompletadaEncontrada) {
        status = 'current';
        primeiraNaoCompletadaEncontrada = true;
      } else {
        status = 'locked';
      }

      return {
        id: fase.faseId,
        xRatio: POSICOES_MAPA[index]?.xRatio ?? 0.5,
        yRatio: POSICOES_MAPA[index]?.yRatio ?? 0.5,
        status,
      };
    });
  }

  static async getFaseById(id) {
    const fasesCache = this.lerCache(CACHE_KEY_FASES);
    const fase = fasesCache.find(f => f.faseId === id);
    if (fase) return fase;

    try {
      const fases = await ApiClient.get('/Fase/listar');
      this.salvarCache(CACHE_KEY_FASES, fases);
      return fases.find(f => f.faseId === id) ?? null;
    } catch (error) {
      console.warn('Não foi possível buscar a fase.', error);
      return null;
    }
  }

  static async getPerguntasByFaseId(faseId) {
    if (!GameState.pacienteId) return [];

    try {
      const resposta = await ApiClient.get(
        `/Jogo/iniciar/${GameState.pacienteId}/${faseId}`
      );

      return resposta.perguntas ?? [];
    } catch (error) {
      console.warn('Não foi possível buscar as perguntas da fase.', error);
      return [];
    }
  }

  static salvarCache(key, dados) {
    try {
      localStorage.setItem(key, JSON.stringify(dados));
    } catch (error) {
      console.warn('Não foi possível salvar o cache local.', error);
    }
  }

  static lerCache(key) {
    try {
      const cache = localStorage.getItem(key);
      return cache ? JSON.parse(cache) : [];
    } catch (error) {
      console.warn('Cache local corrompido, retornando vazio.', error);
      return [];
    }
  }

  static async finalizarFase(faseId, estrelasGanhas) {
    if (!GameState.pacienteId) {
      console.warn('Sem pacienteId — progresso não será salvo.');
      return;
    }

    try {
      await ApiClient.post('/Jogo/finalizar', {
        pacienteId: GameState.pacienteId,
        faseId,
        estrelasGanhas,
      });
    } catch (error) {
      console.warn('Não foi possível salvar o progresso.', error);
    }
  }
}