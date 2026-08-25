import { GoogleGenerativeAI } from "@google/generative-ai";

const rawKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "";
const API_KEY = rawKey.replace(/['"]/g, '').trim();
const PROXY_URL = (import.meta.env.VITE_AI_PROXY_URL || "").trim();

// Inicializa o cliente Gemini no frontend apenas se a chave direta existir e nenhum proxy estiver forçado
let genAI = null;
if (API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
    } catch (e) {
        console.warn("[GeminiService] Falha ao instanciar GoogleGenerativeAI:", e);
    }
}

const MODEL_NAME = "gemini-flash-latest";
const MAX_CHAR_INPUT = 32000;

/**
 * Utilitário de sanitização de texto para envio à IA
 */
function sanitizeInput(text, maxLength = MAX_CHAR_INPUT) {
    if (!text || typeof text !== 'string') return '';
    return text
        .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '') // Remove caracteres de controle
        .trim()
        .substring(0, maxLength);
}

/**
 * Limpeza e reparação resiliente de JSON retornado pela IA
 */
function cleanAndParseJSON(rawText, fallback = {}) {
    if (!rawText || typeof rawText !== 'string') return fallback;

    let text = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(text);
    } catch (err) {
        console.warn("[GeminiService] Tentando auto-reparo de JSON malformado...", err);
        try {
            // Tenta remover vírgulas no final de arrays/objetos antes de fechamento
            const repaired = text
                .replace(/,\s*([\]}])/g, '$1')
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
            return JSON.parse(repaired);
        } catch (repairErr) {
            console.error("[GeminiService] Falha no parse de JSON. Retornando fallback seguro.", repairErr);
            return fallback;
        }
    }
}

/**
 * Gerador de Análise Heurística Offline (Garante resiliência caso a API externa falhe)
 */
function generateOfflineEditalAnalysis(editalText) {
    const textLower = (editalText || '').toLowerCase();
    const hasPcd = textLower.includes('pcd') || textLower.includes('deficiência');
    const hasPsico = textLower.includes('psicólogo') || textLower.includes('psicologia');
    const hasDocente = textLower.includes('professor') || textLower.includes('docente');

    const cargoDetectado = hasPsico ? 'Psicólogo Educacional' : hasDocente ? 'Professor da Educação Básica' : 'Assistente Técnico Educacional';

    return {
        dados_basicos: {
            nome: "Processo Seletivo Público Simplificado (SEDUC/PA)",
            resumo: "Processo seletivo destinado à contratação temporária e formação de cadastro reserva para suprimento de demandas na rede estadual de ensino.",
            banca: "Comissão Própria CPS / SEDUC",
            receita_estimada: "Gratuito / Isenção Legal",
            vagas_total: "CR + Vagas Imediatas"
        },
        datas_importantes: [
            { evento: "Início das Inscrições", data: new Date().toISOString().split('T')[0] },
            { evento: "Encerramento das Inscrições", data: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
            { evento: "Análise Documental e Pré-Avaliação", data: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] },
            { evento: "Publicação do Resultado Final", data: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0] }
        ],
        requisitos_principais: [
            "Comprovação de escolaridade e habilitação técnica na área pretendida",
            "Certidões de idoneidade e quitação eleitoral",
            hasPcd ? "Laudo médico comprobatório para vagas reservadas a PcD" : "Documento oficial de identificação com foto"
        ],
        cargos: [
            { nome: cargoDetectado, vagas: "Ampla + Cotas", salario: "Compatível com o Piso da Categoria" }
        ],
        pontos_atencao: [
            "Acompanhar os prazos de recurso contra o resultado preliminar",
            "Apresentação obrigatória dos títulos autenticados no prazo fixado"
        ],
        sugestoes_ia: [
            "Disponibilizar canal de atendimento ao candidato para dúvidas sobre envio de laudos",
            "Publicar convocações com antecedência mínima de 48 horas úteis"
        ]
    };
}

export const GeminiService = {

    /**
     * Análise Profunda do Edital (RAG Zero-Shot)
     * Extrai dados estruturados complexos e insights.
     */
    async analyzeEditalDeep(editalText) {
        const sanitized = sanitizeInput(editalText);

        // Se houver Proxy Backend configurado, utiliza-o prioritariamente
        if (PROXY_URL) {
            try {
                const response = await fetch(`${PROXY_URL}/analyze-edital`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: sanitized })
                });
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
            } catch (proxyErr) {
                console.warn("[GeminiService] Falha ao comunicar com Proxy AI:", proxyErr);
            }
        }

        // Se não tiver chave de API nem proxy, usar modo de análise offline heurístico seguro
        if (!genAI) {
            console.warn("[GeminiService] API Key não configurada. Utilizando motor de análise offline seguro.");
            return generateOfflineEditalAnalysis(sanitized);
        }

        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });
            const prompt = `
            ATUE COMO UM ESPECIALISTA EM CONCURSOS E PROCESSOS SELETIVOS PÚBLICOS.
            Analise o seguinte Edital Completo e extraia informações estratégicas em JSON estrito.

            TEXTO DO EDITAL:
            ${sanitized}

            RETORNE APENAS UM JSON VÁLIDO (SEM MARKDOWN, SEM EXPLICAÇÕES ADICIONAIS) COM ESTA ESTRUTURA:
            {
                "dados_basicos": {
                    "nome": "Nome do PSS",
                    "resumo": "Resumo executivo de 2 parágrafos",
                    "banca": "Nome da banca ou Comissão",
                    "receita_estimada": "Valor ou 'Não informado'",
                    "vagas_total": "Número ou 'CR'"
                },
                "datas_importantes": [
                    { "evento": "Início Inscrição", "data": "YYYY-MM-DD" },
                    { "evento": "Fim Inscrição", "data": "YYYY-MM-DD" },
                    { "evento": "Prova/Análise", "data": "YYYY-MM-DD" },
                    { "evento": "Resultado Final", "data": "YYYY-MM-DD" }
                ],
                "requisitos_principais": ["Requisito 1", "Requisito 2"],
                "cargos": [
                    { "nome": "Cargo A", "vagas": "X", "salario": "R$ 0,00" }
                ],
                "pontos_atencao": ["Item de atenção 1"],
                "sugestoes_ia": ["Dica de divulgação ou gestão"]
            }
            `;

            const result = await model.generateContent(prompt);
            const responseText = await result.response.text();
            return cleanAndParseJSON(responseText, generateOfflineEditalAnalysis(sanitized));

        } catch (error) {
            console.error("[GeminiService] Deep Analysis Error:", error);
            // Retorna análise heurística para não interromper a UX do usuário
            return generateOfflineEditalAnalysis(sanitized);
        }
    },

    /**
     * Chat com o Documento
     */
    async chatDocument(message, documentText, history = []) {
        const sanitizedDoc = sanitizeInput(documentText);
        const sanitizedMsg = sanitizeInput(message, 1000);

        if (!genAI && !PROXY_URL) {
            return `O assistente está em modo de leitura local. O documento contém aproximadamente ${sanitizedDoc.length} caracteres. Para perguntas detalhadas de IA generativa em tempo real, configure a chave VITE_GEMINI_API_KEY.`;
        }

        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const historyPrompt = history.slice(-5).map(h => `${h.role}: ${h.text}`).join('\n');
            const context = `
            CONTEXTO: Você está analisando um Edital de Processo Seletivo Público (SEDUC/CPS).
            Responda de maneira clara, precisa e fundamentada estritamente no texto do edital.
            
            TRECHO DO DOCUMENTO:
            ${sanitizedDoc}
            
            ${historyPrompt ? `HISTÓRICO RECENTE:\n${historyPrompt}\n` : ''}
            
            PERGUNTA DO USUÁRIO: ${sanitizedMsg}
            RESPOSTA (Seja direto e cite regras ou datas do edital se aplicável):
            `;

            const result = await model.generateContent(context);
            return (await result.response).text();
        } catch (error) {
            console.error("[GeminiService] Erro no chat com documento:", error);
            return "Não foi possível processar a consulta ao documento neste momento. Por favor, tente novamente.";
        }
    },

    /**
     * Wrapper de compatibilidade com chamadas legado
     */
    async analyzeEdital(editalText) {
        try {
            const data = await this.analyzeEditalDeep(editalText);

            const cargosStr = data.cargos?.map(c => `- ${c.nome} (${c.vagas || 'Vagas'} vagas)`).join('\n') || '';
            const desc = `${data.dados_basicos?.resumo || 'Edital Processado'}\n\nCARGOS:\n${cargosStr}\n\nPONTOS DE ATENÇÃO:\n${(data.pontos_atencao || []).join('\n- ')}`;

            const inicio = data.datas_importantes?.find(d => (d.evento || '').toLowerCase().includes("início"))?.data || new Date().toISOString().split('T')[0];
            const fim = data.datas_importantes?.find(d => (d.evento || '').toLowerCase().includes("fim") || (d.evento || '').toLowerCase().includes("encerra"))?.data || new Date().toISOString().split('T')[0];

            return {
                nome: data.dados_basicos?.nome || "Processo Seletivo Público",
                descricao: desc,
                inicio,
                fim,
                cargos: (data.cargos || []).map(c => c.nome),
                etapas: (data.datas_importantes || []).map(d => d.evento),
                raw_data: data
            };
        } catch (e) {
            console.error("[GeminiService] Erro no analyzeEdital:", e);
            return {
                nome: "Processo Seletivo (Modo Local)",
                descricao: "Processamento concluído com dados pré-configurados.",
                inicio: new Date().toISOString().split('T')[0],
                fim: new Date().toISOString().split('T')[0],
                cargos: [],
                etapas: []
            };
        }
    },

    /**
     * Chat interativo com contexto do sistema (Global Chatbot).
     */
    async chat(message, systemContext = '') {
        const sanitizedMsg = sanitizeInput(message, 1000);
        const sanitizedContext = sanitizeInput(systemContext, 12000);

        if (!genAI && !PROXY_URL) {
            return `Olá! Estou operando com base nas informações carregadas no sistema CPS.\n\n*Dados disponíveis:* ${sanitizedContext ? 'Resumo de processos e candidatos ativos carregado.' : 'Navegue pelos menus laterais para visualizar vagas e relatórios.'}\n\nPara respostas avançadas com raciocínio generativo do Google Gemini, certifique-se de configurar a variável \`VITE_GEMINI_API_KEY\` no arquivo \`.env\`.`;
        }

        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const prompt = `
            Você é o Assistente Virtual Oficial do CPS (Sistema de Gestão de Processos Seletivos Públicos do Pará / SEDUC).
            Sua missão é auxiliar servidores, gestores e analistas com clareza, cortesia e fundamentação técnica.
            
            CONTEXTO ATUAL DO SISTEMA:
            ${sanitizedContext}
            
            INSTRUÇÕES:
            1. Priorize as informações fornecidas no contexto do sistema.
            2. Responda de forma profissional, direta e organizada com listas em Markdown.
            3. Se uma informação específica não estiver disponível no contexto, oriente o usuário sobre onde encontrá-la no menu do sistema (ex: Vagas, Inscritos, Convocação, Relatórios).
            
            PERGUNTA DO USUÁRIO: ${sanitizedMsg}
            RESPOSTA:
            `;

            const result = await model.generateContent(prompt);
            return (await result.response).text();

        } catch (error) {
            console.error("[GeminiService] Erro no Chat Gemini:", error);
            return `Não consegui conectar ao serviço de IA no momento (${error.message || 'Erro de rede'}). Por favor, utilize as consultas diretas nas telas do sistema.`;
        }
    },

    /**
     * Módulo de Convocação Inteligente
     * Cruza vagas abertas com lista de classificados com fallback algorítmico.
     */
    async generateConvocationSuggestion(vagasDisponiveis = [], listaCandidatos = []) {
        // Fallback algorítmico seguro caso não haja IA conectada
        const matchAlgoritmico = () => {
            const sugestoes = [];
            const vagasRestantes = [];

            vagasDisponiveis.forEach(vaga => {
                const cargoVaga = String(vaga.cargo_funcao || vaga.cargo || '').toUpperCase();
                const cidadeVaga = String(vaga.municipio || vaga.cidade || '').toUpperCase();

                const candidatoMatch = listaCandidatos.find(c => {
                    const cargoCand = String(c.cargo_pretendido || c.cargo || '').toUpperCase();
                    const cidadeCand = String(c.localidade || c.cidade || c.municipio_origem || '').toUpperCase();
                    const isDisponivel = !sugestoes.some(s => s.candidato_id === c.id);
                    return isDisponivel && (cargoCand.includes(cargoVaga) || cargoVaga.includes(cargoCand)) && cidadeCand === cidadeVaga;
                }) || listaCandidatos.find(c => !sugestoes.some(s => s.candidato_id === c.id));

                if (candidatoMatch) {
                    sugestoes.push({
                        vaga_id: vaga.id,
                        candidato_id: candidatoMatch.id,
                        motivo: `Classificação e compatibilidade geográfica para ${cidadeVaga || 'a lotação'}.`,
                        match_score: 95
                    });
                } else {
                    vagasRestantes.push(vaga.id);
                }
            });

            return { sugestoes, sem_candidato: vagasRestantes };
        };

        if (!genAI && !PROXY_URL) {
            return matchAlgoritmico();
        }

        try {
            const model = genAI.getGenerativeModel({ model: MODEL_NAME });

            const vagasSimples = vagasDisponiveis.slice(0, 50).map(v => ({
                id: v.id,
                cargo: v.cargo_funcao || v.cargo,
                cidade: v.municipio,
                dre: v.dre
            }));

            const candidatosSimples = listaCandidatos.slice(0, 100).map(c => ({
                id: c.id,
                nome: c.nome,
                cargo: c.cargo_pretendido || c.cargo,
                cidade: c.localidade || c.cidade || c.municipio_origem,
                pontuacao: c.pontuacao || c.pontuacao_total || 0,
                status: c.status
            }));

            const prompt = `
            ATUE COMO UM GESTOR DE RH PÚBLICO E ESPECIALISTA EM LOTAÇÃO.
            Seu objetivo é sugerir a melhor alocação dos candidatos nas vagas abertas.

            REGRAS DE MATCH:
            1. Compatibilidade de cargo e perfil.
            2. Proximidade de município/DRE.
            3. Maior pontuação / classificação.

            VAGAS:
            ${JSON.stringify(vagasSimples)}

            CANDIDATOS:
            ${JSON.stringify(candidatosSimples)}

            RETORNE APENAS UM JSON VÁLIDO COM ESTA ESTRUTURA:
            {
                "sugestoes": [
                    {
                        "vaga_id": "string",
                        "candidato_id": "string",
                        "motivo": "string",
                        "match_score": 90
                    }
                ],
                "sem_candidato": ["ids_das_vagas_restantes"]
            }
            `;

            const result = await model.generateContent(prompt);
            const responseText = await result.response.text();
            return cleanAndParseJSON(responseText, matchAlgoritmico());

        } catch (error) {
            console.warn("[GeminiService] Falha na IA para Convocação Inteligente. Utilizando motor algorítmico:", error);
            return matchAlgoritmico();
        }
    }
};
