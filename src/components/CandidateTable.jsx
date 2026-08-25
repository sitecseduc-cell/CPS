import React from 'react';
import { ChevronLeft, ChevronRight, User, Shield, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG = {
    'APROVADO': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle },
    'CONVOCADO': { bg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', icon: CheckCircle },
    'CLASSIFICADO': { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', icon: CheckCircle },
    'EM ANÁLISE': { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', icon: Clock },
    'PENDENTE': { bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', icon: Clock },
    'DESCLASSIFICADO': { bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', icon: XCircle },
    'DESISTENTE': { bg: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700', icon: AlertTriangle },
};

function formatCPF(cpf) {
    if (!cpf) return '-';
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length === 11) {
        return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

export default function CandidateTable({
    candidates = [],
    onSelect,
    total = 0,
    page = 1,
    pageSize = 10,
    onPageChange
}) {
    const totalPages = Math.ceil(total / pageSize) || 1;

    return (
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Tabela Responsiva */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700/60 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Candidato</th>
                            <th className="px-6 py-4">CPF</th>
                            <th className="px-6 py-4">Vaga / Cargo</th>
                            <th className="px-6 py-4">Processo</th>
                            <th className="px-6 py-4">Localidade</th>
                            <th className="px-6 py-4 text-center">Pontuação</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {candidates.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                    Nenhum candidato encontrado nesta pesquisa.
                                </td>
                            </tr>
                        ) : (
                            candidates.map((candidate) => {
                                const statusUpper = String(candidate.status || 'PENDENTE').toUpperCase();
                                const statusStyle = STATUS_CONFIG[statusUpper] || STATUS_CONFIG['PENDENTE'];
                                const StatusIcon = statusStyle.icon;

                                return (
                                    <tr
                                        key={candidate.id}
                                        onClick={() => onSelect && onSelect(candidate)}
                                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors duration-150 group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                    {(candidate.nome || candidate.NOME || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {candidate.nome || candidate.NOME || 'Nome não informado'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                                        {candidate.email || 'Email não cadastrado'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                                            {formatCPF(candidate.cpf || candidate.CPF)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                            {candidate.vaga || candidate.VAGA || candidate.cargo || 'Geral'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                            {candidate.processo || 'PSS 2026/01'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                            {candidate.localidade || candidate.municipio || 'Sede Regional'}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">
                                            {candidate.pontuacao || candidate.pontuacao_total || candidate.PONTUACAO || '0.0'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg}`}>
                                                <StatusIcon size={13} />
                                                {candidate.status || 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mostrando <span className="font-semibold text-slate-700 dark:text-slate-300">{candidates.length}</span> de{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> candidatos (Página {page} de {totalPages})
                </p>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = i + 1;
                            if (totalPages > 5 && page > 3) {
                                pageNum = page - 3 + i + 1;
                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange && onPageChange(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === pageNum
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange && onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
