/**
 * CPS - Sistema de Gestão de Processos Públicos
 * Definições e Contratos de Dados Centrais em TypeScript
 */

export type PapelUsuario = 'admin' | 'gestor' | 'analista' | 'suporte' | 'servidor';

export interface PerfilUsuario {
  id: string;
  email: string;
  nome_completo?: string;
  role: PapelUsuario;
  avatar_url?: string;
  departamento?: string;
  ativo: boolean;
  ultimo_acesso?: string;
  created_at?: string;
}

export type StatusProcesso = 'Planejamento' | 'Inscrições Abertas' | 'Em Análise' | 'Homologado' | 'Concluído' | 'Cancelado';

export interface ProcessoSeletivo {
  id: string;
  numero_edital: string;
  titulo: string;
  descricao?: string;
  status: StatusProcesso;
  data_inicio_inscricao: string;
  data_fim_inscricao: string;
  data_resultado_preliminar?: string;
  data_resultado_final?: string;
  total_vagas: number;
  total_inscritos?: number;
  banca_examinadora?: string;
  documento_edital_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type StatusCandidato = 
  | 'Inscrito' 
  | 'Em Análise' 
  | 'Classificado' 
  | 'Desclassificado' 
  | 'Convocado' 
  | 'Empossado' 
  | 'Desistente' 
  | 'Substituído';

export interface Candidato {
  id: string;
  processo_id?: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  municipio_origem?: string;
  cargo_pretendido?: string;
  vaga_concorrida?: string;
  pontuacao_total: number;
  classificacao_geral?: number;
  classificacao_cota?: number;
  status: StatusCandidato;
  cota_tipo?: 'Ampla Concorrência' | 'PcD' | 'Afrodescendente' | 'Indígena' | 'Quilombola';
  escola_alocada?: string;
  dre_alocada?: string;
  data_inscricao?: string;
  documentos_anexos?: Array<{ nome: string; url: string }>;
}

export type PorteEscola = 'Pequeno Porte' | 'Médio Porte (Tipo A)' | 'Médio Porte (Tipo B)' | 'Grande Porte';

export interface EscolaBase {
  id: string;
  import_id?: string;
  nome_escola: string;
  municipio: string;
  dre: string;
  area_localizacao: 'Urbana' | 'Rural' | 'Indígena' | 'Quilombola';
  total_alunos: number;
  porte: PorteEscola;
  psicologos_alocados: number;
  status_alocacao: 'Pendente' | 'Parcial' | 'Atendida' | 'Excedente';
  meta_psicologos: number;
  created_at?: string;
}

export interface RegraAlocacao {
  id: string;
  descricao: string;
  total_vagas_disponivel: number;
  psic_por_escolas_pequenas: number;
  limite_pequeno_max: number;
  limite_medio_b_max: number;
  psic_por_alunos_grande: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  changed_by?: string;
}

export interface EstatisticasDashboard {
  candidatos: number;
  processos: number;
  vagasPreenchidas: number;
  atrasos: number;
}

export interface FunilEtapa {
  label: string;
  count: number;
  color: string;
}

export interface AuditoriaLog {
  id: string;
  usuario_id: string;
  usuario_email: string;
  acao: string;
  tabela_afetada?: string;
  registro_id?: string;
  dados_anteriores?: Record<string, any>;
  dados_novos?: Record<string, any>;
  ip_origem?: string;
  created_at: string;
}

export interface EditalAnaliseIA {
  dados_basicos: {
    nome: string;
    resumo: string;
    banca: string;
    receita_estimada?: string;
    vagas_total: string;
  };
  datas_importantes: Array<{
    evento: string;
    data: string;
  }>;
  requisitos_principais: string[];
  cargos: Array<{
    nome: string;
    vagas: string;
    salario: string;
  }>;
  pontos_atencao: string[];
  sugestoes_ia: string[];
}
