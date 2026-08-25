/**
 * CPS - Utilitário de Processamento Seguro e Chunked de Arquivos
 * Evita travamento da thread principal durante leitura de planilhas e relatórios grandes.
 */
import { read, utils } from 'xlsx';
import Papa from 'papaparse';

/**
 * Lê e processa arquivo Excel (.xlsx / .xls) de forma assíncrona com fatiamento
 * @param {File|ArrayBuffer} file - Arquivo a ser lido
 * @param {Object} options - Opções (chunkSize, onProgress, maxRows)
 * @returns {Promise<Array<Object>>}
 */
export async function parseExcelAsync(file, options = {}) {
    const {
        chunkSize = 1000,
        maxRows = 100000,
        sheetIndex = 0,
        onProgress = () => { }
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[sheetIndex] || workbook.SheetNames[0];

                if (!sheetName) {
                    throw new Error("Nenhuma planilha encontrada no arquivo.");
                }

                const worksheet = workbook.Sheets[sheetName];
                const rawRows = utils.sheet_to_json(worksheet, { defval: '' });

                const totalRows = Math.min(rawRows.length, maxRows);
                const processed = [];

                let currentIndex = 0;

                function processNextChunk() {
                    const limit = Math.min(currentIndex + chunkSize, totalRows);
                    for (let i = currentIndex; i < limit; i++) {
                        processed.push(rawRows[i]);
                    }
                    currentIndex = limit;

                    const percent = Math.round((currentIndex / totalRows) * 100);
                    onProgress(percent, currentIndex, totalRows);

                    if (currentIndex < totalRows) {
                        // Cede o controle para o event loop do navegador respirar
                        setTimeout(processNextChunk, 0);
                    } else {
                        resolve(processed);
                    }
                }

                processNextChunk();
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);

        if (file instanceof File || file instanceof Blob) {
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error("Formato de arquivo inválido para leitura."));
        }
    });
}

/**
 * Lê e processa arquivo CSV com streaming de alta performance via PapaParse
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<Array<Object>>}
 */
export function parseCSVAsync(file, options = {}) {
    const {
        chunkSize = 2000,
        maxRows = 100000,
        onProgress = () => { }
    } = options;

    return new Promise((resolve, reject) => {
        const results = [];
        let rowsCount = 0;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            chunkSize: 1024 * 64, // 64KB chunks
            chunk: (chunk, parser) => {
                for (const row of chunk.data) {
                    if (rowsCount < maxRows) {
                        results.push(row);
                        rowsCount++;
                    } else {
                        parser.abort();
                        break;
                    }
                }
                onProgress(rowsCount);
            },
            complete: () => {
                resolve(results);
            },
            error: (err) => {
                reject(err);
            }
        });
    });
}

/**
 * Validador e normalizador de CPFs para planilhas de candidatos
 */
export function normalizeCPF(cpf) {
    if (!cpf) return '';
    const digits = String(cpf).replace(/\D/g, '');
    if (digits.length === 11) {
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return digits;
}

/**
 * Validador de dados básicos de candidato importado
 */
export function validateCandidateRow(row) {
    const nome = row.nome || row.NOME || row['Nome do candidato'] || row['Nome'] || '';
    const cpf = row.cpf || row.CPF || row['CPF'] || '';

    if (!nome || String(nome).trim().length < 3) {
        return { valid: false, error: 'Nome inválido ou ausente' };
    }
    const cleanCpf = String(cpf).replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
        return { valid: false, error: 'CPF inválido (deve conter 11 dígitos)' };
    }
    return { valid: true };
}
