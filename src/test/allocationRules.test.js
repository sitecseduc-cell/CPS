import { describe, it, expect } from 'vitest';

export function classificarPorteEscola(totalAlunos, limitePequeno = 700, limiteMedioB = 999) {
    if (totalAlunos <= limitePequeno) return 'Pequeno Porte';
    if (totalAlunos <= limiteMedioB) return 'Médio Porte';
    return 'Grande Porte';
}

export function calcularDemandaAlocacao(regra, amostra = { escolasPequenoMedio: 477, alunosGrandePorte: 41000 }) {
    const psicPorEscolas = regra.psic_por_escolas_pequenas || 3;
    const psicPorAlunosGrande = regra.psic_por_alunos_grande || 1000;
    const vagas = regra.total_vagas_disponivel || 200;

    const nPeqMedio = Math.ceil(amostra.escolasPequenoMedio / psicPorEscolas);
    const nGrande = Math.ceil(amostra.alunosGrandePorte / psicPorAlunosGrande);

    const demandaBruta = nPeqMedio + nGrande;

    let total = demandaBruta;
    let nFixo = nGrande;
    let nComp = nPeqMedio;

    if (total > vagas) {
        total = vagas;
        const pctGrande = nGrande / demandaBruta;
        nFixo = Math.floor(vagas * pctGrande);
        nComp = vagas - nFixo;
    }

    return {
        nPeqMedio: nComp,
        nGrande: nFixo,
        total,
        demandaBruta
    };
}

describe('Motor de Regras de Alocação de Profissionais', () => {
    describe('Classificação de Portes Escolares', () => {
        it('classifica escola com até 700 alunos como Pequeno Porte', () => {
            expect(classificarPorteEscola(150)).toBe('Pequeno Porte');
            expect(classificarPorteEscola(700)).toBe('Pequeno Porte');
        });

        it('classifica escola entre 701 e 999 alunos como Médio Porte', () => {
            expect(classificarPorteEscola(701)).toBe('Médio Porte');
            expect(classificarPorteEscola(850)).toBe('Médio Porte');
            expect(classificarPorteEscola(999)).toBe('Médio Porte');
        });

        it('classifica escola com 1000 alunos ou mais como Grande Porte', () => {
            expect(classificarPorteEscola(1000)).toBe('Grande Porte');
            expect(classificarPorteEscola(2500)).toBe('Grande Porte');
        });
    });

    describe('Cálculo de Demanda e Distribuição de Vagas', () => {
        const regraPadrao = {
            total_vagas_disponivel: 200,
            psic_por_escolas_pequenas: 3,
            limite_pequeno_max: 700,
            limite_medio_b_max: 999,
            psic_por_alunos_grande: 1000
        };

        it('calcula demanda proporcional respeitando o teto de 200 vagas', () => {
            const resultado = calcularDemandaAlocacao(regraPadrao);

            expect(resultado.total).toBe(200);
            expect(resultado.demandaBruta).toBe(200); // 159 + 41 = 200
            expect(resultado.nPeqMedio + resultado.nGrande).toBe(200);
        });

        it('respeita teto configurado de vagas se a demanda exceder', () => {
            const regraLimitada = {
                ...regraPadrao,
                total_vagas_disponivel: 100
            };

            const resultado = calcularDemandaAlocacao(regraLimitada);
            expect(resultado.total).toBe(100);
            expect(resultado.nPeqMedio + resultado.nGrande).toBe(100);
        });

        it('atende demanda total se o número de vagas disponíveis for superior', () => {
            const regraFolga = {
                ...regraPadrao,
                total_vagas_disponivel: 500
            };

            const resultado = calcularDemandaAlocacao(regraFolga, { escolasPequenoMedio: 60, alunosGrandePorte: 10000 });
            expect(resultado.demandaBruta).toBe(30); // 20 + 10 = 30
            expect(resultado.total).toBe(30);
            expect(resultado.nPeqMedio).toBe(20);
            expect(resultado.nGrande).toBe(10);
        });
    });
});
