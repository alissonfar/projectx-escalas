/**
 * Tipos TypeScript baseados no modelo de dados do PRD
 */

// Definir tipos básicos primeiro para uso no tipo Database
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
  telefone2: string | null
  data_nascimento: string | null
  profissao: string | null
  crefito: string | null
  uf_crefito: string | null
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

// Tipos auxiliares para Insert e Update (garantir resolução correta de tipos)
type OrganizacaoInsert = Omit<Organizacao, 'id' | 'created_at'>
type OrganizacaoUpdate = Partial<OrganizacaoInsert>
type HospitalInsert = Omit<Hospital, 'id' | 'created_at'>
type HospitalUpdate = Partial<HospitalInsert>
type GrupoInsert = Omit<Grupo, 'id' | 'created_at'>
type GrupoUpdate = Partial<GrupoInsert>
type SetorInsert = Omit<Setor, 'id' | 'created_at'>
type SetorUpdate = Partial<SetorInsert>
type ProfissionalInsert = Omit<Profissional, 'id' | 'created_at'>
type ProfissionalUpdate = Partial<ProfissionalInsert>
type EscalaInsert = Omit<Escala, 'id' | 'created_at' | 'updated_at'>
type EscalaUpdate = Partial<EscalaInsert>
type EscalaPeriodoInsert = Omit<EscalaPeriodo, 'id' | 'created_at' | 'updated_at'>
type EscalaPeriodoUpdate = Partial<EscalaPeriodoInsert>
type EscalaAlocacaoInsert = Omit<EscalaAlocacao, 'id' | 'created_at' | 'updated_at'>
type EscalaAlocacaoUpdate = Partial<EscalaAlocacaoInsert>
type ProfileInsert = Omit<Profile, 'created_at'>
type ProfileUpdate = Partial<ProfileInsert>

// Tipo Database para Supabase
// Para gerar tipos completos do Supabase, execute: npm run gen-types
// Isso gerará types/database-generated.ts que pode ser importado aqui
export type Database = {
  public: {
    Tables: {
      organizacoes: {
        Row: Organizacao
        Insert: OrganizacaoInsert
        Update: OrganizacaoUpdate
      }
      hospitais: {
        Row: Hospital
        Insert: HospitalInsert
        Update: HospitalUpdate
      }
      grupos: {
        Row: Grupo
        Insert: GrupoInsert
        Update: GrupoUpdate
      }
      setores: {
        Row: Setor
        Insert: SetorInsert
        Update: SetorUpdate
      }
      profissionais: {
        Row: Profissional
        Insert: ProfissionalInsert
        Update: ProfissionalUpdate
      }
      escalas: {
        Row: Escala
        Insert: EscalaInsert
        Update: EscalaUpdate
      }
      escala_periodos: {
        Row: EscalaPeriodo
        Insert: EscalaPeriodoInsert
        Update: EscalaPeriodoUpdate
      }
      escala_alocacoes: {
        Row: EscalaAlocacao
        Insert: EscalaAlocacaoInsert
        Update: EscalaAlocacaoUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
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

