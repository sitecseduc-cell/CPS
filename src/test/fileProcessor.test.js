import { describe, it, expect } from 'vitest';
import { normalizeCPF, validateCandidateRow } from '../utils/fileProcessor';

describe('Utilitário de Processamento de Arquivos e Normalização', () => {
    describe('Normalização de CPF', () => {
        it('formata adequadamente CPF com 11 dígitos numéricos', () => {
            expect(normalizeCPF('12345678901')).toBe('123.456.789-01');
        });

        it('mantém formatação se já possuir pontuação', () => {
            expect(normalizeCPF('123.456.789-01')).toBe('123.456.789-01');
        });

        it('retorna string limpa se tamanho for inválido', () => {
            expect(normalizeCPF('12345')).toBe('12345');
            expect(normalizeCPF('')).toBe('');
        });
    });

    describe('Validação de Linhas de Candidatos', () => {
        it('aprova linha com nome e CPF válidos', () => {
            const linha = {
                'Nome do candidato': 'Mariana Rocha',
                'CPF': '123.456.789-00'
            };
            const res = validateCandidateRow(linha);
            expect(res.valid).toBe(true);
        });

        it('rejeita linha com nome ausente ou curto demais', () => {
            const linha = {
                'Nome do candidato': 'A',
                'CPF': '123.456.789-00'
            };
            const res = validateCandidateRow(linha);
            expect(res.valid).toBe(false);
            expect(res.error).toContain('Nome');
        });

        it('rejeita linha com CPF incompleto', () => {
            const linha = {
                'Nome do candidato': 'Mariana Rocha',
                'CPF': '12345'
            };
            const res = validateCandidateRow(linha);
            expect(res.valid).toBe(false);
            expect(res.error).toContain('CPF');
        });
    });
});
