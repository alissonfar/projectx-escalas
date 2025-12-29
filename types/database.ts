/**
 * Tipos TypeScript baseados no modelo de dados do PRD
 */

// Tipo Database para Supabase
// Para gerar tipos completos do Supabase, execute: npm run gen-types
// Isso gerará types/database-generated.ts que pode ser importado aqui
export type Database = {
  public: {
    Tables: {
      organizacoes: {
        Row: Organizacao
        Insert: Omit<Organizacao, 'id' | 'created_at'>
        Update: Partial<Omit<Organizacao, 'id' | 'created_at'>>
      }
      hospitais: {
        Row: Hospital
        Insert: Omit<Hospital, 'id' | 'created_at'>
        Update: Partial<Omit<Hospital, 'id' | 'created_at'>>
      }
      grupos: {
        Row: Grupo
        Insert: Omit<Grupo, 'id' | 'created_at'>
        Update: Partial<Omit<Grupo, 'id' | 'created_at'>>
      }
      setores: {
        Row: Setor
        Insert: Omit<Setor, 'id' | 'created_at'>
        Update: Partial<Omit<Setor, 'id' | 'created_at'>>
      }
      profissionais: {
        Row: Profissional
        Insert: Omit<Profissional, 'id' | 'created_at'>
        Update: Partial<Omit<Profissional, 'id' | 'created_at'>>
      }
      escalas: {
        Row: Escala
        Insert: Omit<Escala, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Escala, 'id' | 'created_at' | 'updated_at'>>
      }
      escala_periodos: {
        Row: EscalaPeriodo
        Insert: Omit<EscalaPeriodo, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EscalaPeriodo, 'id' | 'created_at' | 'updated_at'>>
      }
      escala_alocacoes: {
        Row: EscalaAlocacao
        Insert: Omit<EscalaAlocacao, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EscalaAlocacao, 'id' | 'created_at' | 'updated_at'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Organizacao = {
  id: string
  nome: string
  criado_por: string
  ativo: boolean
  created_at: string
}

export type Hospital = {
  id: string
  organizacao_id: string
  nome: string
  ativo: boolean
  created_at: string
}

export type Grupo = {
  id: string
  organizacao_id: string
  nome: string
  tipo: string
  ativo: boolean
  created_at: string
}

export type Setor = {
  id: string
  hospital_id: string
  nome: string
  ativo: boolean
  created_at: string
}

export type Profissional = {
  id: string
  grupo_id: string
  nome: string
  email: string
  telefone: string | null
  ativo: boolean
  created_at: string
}

// NOVO MODELO: Escala como container contínuo do setor
export type Escala = {
  id: string
  setor_id: string
  created_at: string
  updated_at: string
}

// Estado do período (pré-escala ou publicada)
export type EscalaPeriodoEstado = 'pre_escala' | 'publicada'

// Período mensal versionado
export type EscalaPeriodo = {
  id: string
  escala_id: string
  mes: number // 1-12
  ano: number // ex: 2025
  versao: number
  estado: EscalaPeriodoEstado
  publicado_em: string | null
  publicado_por: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// Turnos possíveis
export type EscalaTurno = 'manha' | 'tarde' | 'noite' | 'integral'

// Alocação de profissional dentro de um período
export type EscalaAlocacao = {
  id: string
  periodo_id: string
  profissional_id: string
  data_inicio: string
  data_fim: string
  turno: EscalaTurno
  observacoes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string // FK auth.users
  nome_completo: string
  organizacao_ativa_id: string | null
  created_at: string
}

// Tipos com relacionamentos (para queries com joins)
export type EscalaComSetor = Escala & {
  setor: Setor & {
    hospital: Hospital
  }
}

export type EscalaPeriodoCompleto = EscalaPeriodo & {
  escala: Escala & {
    setor: Setor & {
      hospital: Hospital
    }
  }
  alocacoes?: EscalaAlocacaoCompleta[]
}

export type EscalaAlocacaoCompleta = EscalaAlocacao & {
  profissional: Profissional & {
    grupo: Grupo
  }
}

export type ProfissionalComGrupo = Profissional & {
  grupo: Grupo
}

export type SetorComHospital = Setor & {
  hospital: Hospital
}

export type GrupoComOrganizacao = Grupo & {
  organizacao: Organizacao
}

