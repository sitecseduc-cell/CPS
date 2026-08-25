import { describe, it, expect } from 'vitest';
import { GeminiService } from '../services/GeminiService';

describe('GeminiService - Camada de Inteligência Artificial e Fallbacks', () => {
    it('retorna estrutura de análise profunda offline consistente quando sem chave de API', async () => {
        const editalTexto = 'Edital do Processo Seletivo Simplificado para contratação de Psicólogo e Professor na SEDUC/PA. Inscrições abertas.';
        const resultado = await GeminiService.analyzeEditalDeep(editalTexto);

        expect(resultado).toBeDefined();
        expect(resultado.dados_basicos).toBeDefined();
        expect(resultado.dados_basicos.nome).toContain('Processo Seletivo');
        expect(Array.isArray(resultado.datas_importantes)).toBe(true);
        expect(Array.isArray(resultado.requisitos_principais)).toBe(true);
        expect(Array.isArray(resultado.cargos)).toBe(true);
        expect(Array.isArray(resultado.pontos_atencao)).toBe(true);
    });

    it('responde chat de documento em modo de segurança offline', async () => {
        const docText = 'O presente processo seletivo terá validade de 12 meses, prorrogável por igual período.';
        const resposta = await GeminiService.chatDocument('Qual a validade?', docText);

        expect(typeof resposta).toBe('string');
        expect(resposta.length).toBeGreaterThan(10);
    });

    it('gera sugestões de convocação inteligentemente mesmo offline', async () => {
        const vagas = [
            { id: 'vaga-1', cargo: 'Psicólogo Educacional', municipio: 'BELEM', dre: 'Capital' },
            { id: 'vaga-2', cargo: 'Professor Matemática', municipio: 'MARABA', dre: 'Interior' }
        ];

        const candidatos = [
            { id: 'cand-1', nome: 'João Psicologia', cargo_pretendido: 'Psicólogo Educacional', municipio_origem: 'BELEM', pontuacao: 90, status: 'Classificado' },
            { id: 'cand-2', nome: 'Maria Matemática', cargo_pretendido: 'Professor Matemática', municipio_origem: 'MARABA', pontuacao: 85, status: 'Classificado' }
        ];

        const match = await GeminiService.generateConvocationSuggestion(vagas, candidatos);

        expect(match).toBeDefined();
        expect(Array.isArray(match.sugestoes)).toBe(true);
        expect(match.sugestoes.length).toBe(2);

        const sugestaoVaga1 = match.sugestoes.find(s => s.vaga_id === 'vaga-1');
        expect(sugestaoVaga1).toBeDefined();
        expect(sugestaoVaga1.candidato_id).toBe('cand-1');
    });
});
