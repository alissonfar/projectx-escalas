import { createClient } from '@/lib/supabase/client'

export type ValidationResult = {
  can: boolean
  reason?: string
  count?: number
}

/**
 * Verifica se um hospital pode ser desativado
 * Retorna false se houver setores ativos vinculados
 */
export async function canDeactivateHospital(hospitalId: string): Promise<ValidationResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('check_hospital_has_active_setores', {
    hospital_id: hospitalId
  })
  
  if (error) {
    return {
      can: false,
      reason: 'Erro ao verificar dependências'
    }
  }
  
  if (data === true) {
    // Buscar quantidade de setores ativos para mensagem
    const { count } = await supabase
      .from('setores')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('ativo', true)
    
    return {
      can: false,
      reason: `Não é possível desativar o hospital pois existem ${count || 0} setor(es) ativo(s) vinculado(s). Desative os setores primeiro.`,
      count: count || 0
    }
  }
  
  return { can: true }
}

/**
 * Verifica se um setor pode ser desativado
 * Retorna false se houver escalas ativas (futuras ou em andamento) vinculadas
 */
export async function canDeactivateSetor(setorId: string): Promise<ValidationResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('check_setor_has_active_escalas', {
    setor_id: setorId
  })
  
  if (error) {
    return {
      can: false,
      reason: 'Erro ao verificar dependências'
    }
  }
  
  if (data === true) {
    // Buscar quantidade de escalas ativas para mensagem
    const { count } = await supabase
      .from('escalas')
      .select('*', { count: 'exact', head: true })
      .eq('setor_id', setorId)
      .eq('status', 'confirmado')
      .gte('data_fim', new Date().toISOString())
    
    return {
      can: false,
      reason: `Não é possível desativar o setor pois existem ${count || 0} escala(s) confirmada(s) futura(s) ou em andamento. Cancele as escalas primeiro.`,
      count: count || 0
    }
  }
  
  return { can: true }
}

/**
 * Verifica se um grupo pode ser desativado
 * Retorna false se houver profissionais ativos vinculados
 */
export async function canDeactivateGrupo(grupoId: string): Promise<ValidationResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('check_grupo_has_active_profissionais', {
    grupo_id: grupoId
  })
  
  if (error) {
    return {
      can: false,
      reason: 'Erro ao verificar dependências'
    }
  }
  
  if (data === true) {
    // Buscar quantidade de profissionais ativos para mensagem
    const { count } = await supabase
      .from('profissionais')
      .select('*', { count: 'exact', head: true })
      .eq('grupo_id', grupoId)
      .eq('ativo', true)
    
    return {
      can: false,
      reason: `Não é possível desativar o grupo pois existem ${count || 0} profissional(is) ativo(s) vinculado(s). Desative os profissionais primeiro.`,
      count: count || 0
    }
  }
  
  return { can: true }
}

/**
 * Verifica se um profissional pode ser desativado
 * Retorna false se houver escalas futuras confirmadas vinculadas
 */
export async function canDeactivateProfissional(profissionalId: string): Promise<ValidationResult> {
  const supabase = createClient()
  
  const { data, error } = await supabase.rpc('check_profissional_has_future_escalas', {
    profissional_id: profissionalId
  })
  
  if (error) {
    return {
      can: false,
      reason: 'Erro ao verificar dependências'
    }
  }
  
  if (data === true) {
    // Buscar quantidade de escalas futuras para mensagem
    const { count } = await supabase
      .from('escalas')
      .select('*', { count: 'exact', head: true })
      .eq('profissional_id', profissionalId)
      .eq('status', 'confirmado')
      .gt('data_inicio', new Date().toISOString())
    
    return {
      can: false,
      reason: `Não é possível desativar o profissional pois existem ${count || 0} escala(s) confirmada(s) futura(s). Cancele as escalas primeiro.`,
      count: count || 0
    }
  }
  
  return { can: true }
}

