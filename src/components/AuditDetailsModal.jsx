import React from 'react';
import { X, Shield, Clock, User, Database, ArrowRight, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditDetailsModal({ isOpen, onClose, log }) {
    if (!isOpen || !log) return null;

    const op = String(log.operation || log.action || log.acao || 'UPDATE').toUpperCase();

    const getOpBadge = (operation) => {
        switch (operation) {
            case 'INSERT':
            case 'CREATE':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
            case 'DELETE':
            case 'REMOVE':
                return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
        }
    };

    let formattedDate = 'Data não informada';
    try {
        if (log.created_at || log.timestamp) {
            formattedDate = format(new Date(log.created_at || log.timestamp), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR });
        }
    } catch (e) {
        formattedDate = String(log.created_at || 'Data inválida');
    }

    const oldData = log.old_record || log.dados_anteriores || null;
    const newData = log.new_record || log.dados_novos || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Registro de Auditoria</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Rastreabilidade e conformidade institucional</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-slate-600 dark:text-slate-300">

                    {/* Metadados rápidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                <Clock size={14} /> Data & Hora
                            </div>
                            <p className="font-medium text-slate-900 dark:text-white">{formattedDate}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                <User size={14} /> Operador / Usuário
                            </div>
                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                {log.user_email || log.usuario_email || log.user_id || 'Sistema Automatizado'}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                <Database size={14} /> Tabela Afetada
                            </div>
                            <p className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                                {log.table_name || log.tabela || 'Não especificada'}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                <FileText size={14} /> Ação Executada
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getOpBadge(op)}`}>
                                {op}
                            </span>
                        </div>
                    </div>

                    {/* Diff de Dados */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <Database size={16} className="text-indigo-500" /> Detalhes dos Dados Modificados
                        </h4>

                        {oldData || newData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {oldData && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-bold text-rose-500 uppercase">Valores Anteriores (Antes)</p>
                                        <pre className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48">
                                            {typeof oldData === 'object' ? JSON.stringify(oldData, null, 2) : String(oldData)}
                                        </pre>
                                    </div>
                                )}

                                {newData && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-bold text-emerald-500 uppercase">Novos Valores (Depois)</p>
                                        <pre className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-48">
                                            {typeof newData === 'object' ? JSON.stringify(newData, null, 2) : String(newData)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic text-center">
                                {log.description || log.descricao || log.resumo || 'Nenhum payload JSON adicional gravado neste evento.'}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold text-sm transition-all shadow-sm"
                    >
                        Fechar
                    </button>
                </div>

            </div>
        </div>
    );
}
