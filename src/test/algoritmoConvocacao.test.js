import { describe, it, expect } from 'vitest';
import { executarAnalise } from '../utils/algoritmoConvocacao';

describe('Algoritmo de Convocação e Ranking', () => {
    const baseMestra = [
        {
            cpf: '12345678901',
            municipio: 'BELEM',
            cargo: 'PROFESSOR LINGUAGENS PORTUGUES',
            pontuacao_total: '85.5',
            rank: '1'
        },
        {
            cpf: '98765432100',
            municipio: 'ANANINDEUA',
            cargo: 'PROFESSOR LINGUAGENS PORTUGUES',
            pontuacao_total: '92.0',
            rank: '2'
        },
        {
            cpf: '11122233344',
            municipio: 'MARABA',
            cargo: 'PROFESSOR MATEMATICA',
            pontuacao_total: '78.0',
            rank: '3'
        }
    ];

    it('classifica corretamente candidatos com base na compatibilidade e pontuação', () => {
        const inscricoes = [
            {
                'Nome do candidato': 'Carlos Silva',
                'CPF': '123.456.789-01',
                'Vaga que deseja concorrer': 'VAGA BELEM - LINGUAGENS',
                'Carimbo de data/hora': '2025-11-01T10:00:00'
            },
            {
                'Nome do candidato': 'Ana Souza',
                'CPF': '987.654.321-00',
                'Vaga que deseja concorrer': 'VAGA BELEM - LINGUAGENS',
                'Carimbo de data/hora': '2025-11-02T10:00:00'
            }
        ];

        const resultados = executarAnalise(inscricoes, baseMestra);

        expect(resultados).toHaveLength(2);

        const habilitado = resultados.find(r => r.STATUS_FINAL === 'HABILITADO');
        expect(habilitado).toBeDefined();
        expect(habilitado.NOME).toBe('Carlos Silva'); // Score Geo 100 (Origem Belem = Vaga Belem)
        expect(habilitado.SCORE_GEO).toBe(100);

        const segundo = resultados.find(r => r.STATUS_FINAL === 'POSSÍVEL CHANCE');
        expect(segundo).toBeDefined();
        expect(segundo.NOME).toBe('Ana Souza'); // Score Geo 50 (Vizinho Ananindeua)
        expect(segundo.SCORE_GEO).toBe(50);
    });

    it('desclassifica candidato não encontrado na base mestra', () => {
        const inscricoes = [
            {
                'Nome do candidato': 'Candidato Desconhecido',
                'CPF': '00000000000',
                'Vaga que deseja concorrer': 'VAGA BELEM - LINGUAGENS',
                'Carimbo de data/hora': '2025-11-01T10:00:00'
            }
        ];

        const resultados = executarAnalise(inscricoes, baseMestra);
        expect(resultados[0].STATUS_INTERNO).toBe('DESCLASSIFICADO');
        expect(resultados[0].STATUS_FINAL).toBe('DESABILITADO');
        expect(resultados[0].MOTIVO).toBe('SEM NOTA/BASE');
    });

    it('desclassifica candidato fora do prazo limite', () => {
        const inscricoes = [
            {
                'Nome do candidato': 'Carlos Silva',
                'CPF': '123.456.789-01',
                'Vaga que deseja concorrer': 'VAGA BELEM - LINGUAGENS',
                'Carimbo de data/hora': '2026-01-01T10:00:00' // Posterior a 2025-12-09
            }
        ];

        const resultados = executarAnalise(inscricoes, baseMestra);
        expect(resultados[0].STATUS_INTERNO).toBe('DESCLASSIFICADO');
        expect(resultados[0].MOTIVO).toBe('FORA DO PRAZO');
    });
});
