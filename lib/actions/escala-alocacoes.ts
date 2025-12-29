'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { escalaAlocacaoSchemaCompleto, type EscalaAlocacaoFormData } from '@/lib/validations/escala-alocacao'
import type { EscalaAlocacao, EscalaAlocacaoCompleta, Profissional, Grupo } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
  conflitos?: EscalaAlocacao[]
}

/**
 * Buscar alocações de um período
 */
export async function buscarAlocacoesPeriodo(periodoId: string): Promise<EscalaAlocacaoCompleta[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('escala_alocacoes')
      .select(`
        *,
        profissionais (
          *,
          grupos (
            *
          )
        )
      `)
      .eq('periodo_id', periodoId)
      .order('data_inicio', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar alocações:', error)
      return []
    }
    
    return (data || []).map((item: any) => ({
      ...item,
      profissional: {
        ...item.profissionais,
        grupo: item.profissionais.grupos
      }
    })) as EscalaAlocacaoCompleta[]
  } catch (error) {
    console.error('Erro ao buscar alocações:', error)
    return []
  }
}

/**
 * Criar nova alocação
 */
export async function criarAlocacao(data: EscalaAlocacaoFormData): Promise<ActionResult> {
  try {
    const validated = await escalaAlocacaoSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    // Verificar se período está em pre_escala
    const { data: periodo, error: periodoError } = await supabase
      .from('escala_periodos')
      .select('estado')
      .eq('id', validated.periodo_id)
      .single()
    
    if (periodoError || !periodo) {
      return { success: false, error: 'Período não encontrado' }
    }
    
    if (periodo.estado !== 'pre_escala') {
      return { success: false, error: 'Não é possível adicionar alocações em período publicado. Despublique primeiro.' }
    }
    
    // Verificar conflitos com outras alocações do mesmo profissional
    const conflitos = await verificarConflitos(
      validated.profissional_id,
      validated.data_inicio,
      validated.data_fim
    )
    
    // Criar alocação (permite mesmo com conflitos, mas avisa)
    const { error } = await supabase
      .from('escala_alocacoes')
      .insert({
        periodo_id: validated.periodo_id,
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        turno: validated.turno || null,
        observacoes: validated.observacoes?.trim() || null,
        created_by: user.id
      })
    
    if (error) {
      console.error('Erro ao criar alocação:', error)
      return { success: false, error: 'Erro ao criar alocação' }
    }
    
    revalidatePath('/escalas')
    
    if (conflitos.length > 0) {
      return {
        success: true,
        message: 'Alocação criada com sucesso. Atenção: há conflitos de horário.',
        conflitos
      }
    }
    
    return { success: true, message: 'Alocação criada com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar alocação' }
  }
}

/**
 * Atualizar alocação existente
 */
export async function atualizarAlocacao(
  alocacaoId: string,
  data: EscalaAlocacaoFormData
): Promise<ActionResult> {
  try {
    const validated = await escalaAlocacaoSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    
    // Verificar se alocação existe
    const { data: alocacao, error: fetchError } = await supabase
      .from('escala_alocacoes')
      .select('id, periodo_id')
      .eq('id', alocacaoId)
      .single()
    
    if (fetchError || !alocacao) {
      return { success: false, error: 'Alocação não encontrada' }
    }
    
    // Verificar se período está em pre_escala
    const { data: periodo, error: periodoError } = await supabase
      .from('escala_periodos')
      .select('estado')
      .eq('id', alocacao.periodo_id)
      .single()
    
    if (periodoError || !periodo) {
      return { success: false, error: 'Período não encontrado' }
    }
    
    if (periodo.estado !== 'pre_escala') {
      return { success: false, error: 'Não é possível editar alocações em período publicado. Despublique primeiro.' }
    }
    
    // Verificar conflitos (excluindo esta alocação)
    const conflitos = await verificarConflitos(
      validated.profissional_id,
      validated.data_inicio,
      validated.data_fim,
      alocacaoId
    )
    
    // Atualizar
    const { error } = await supabase
      .from('escala_alocacoes')
      .update({
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        turno: validated.turno || null,
        observacoes: validated.observacoes?.trim() || null
      })
      .eq('id', alocacaoId)
    
    if (error) {
      console.error('Erro ao atualizar alocação:', error)
      return { success: false, error: 'Erro ao atualizar alocação' }
    }
    
    revalidatePath('/escalas')
    
    if (conflitos.length > 0) {
      return {
        success: true,
        message: 'Alocação atualizada com sucesso. Atenção: há conflitos de horário.',
        conflitos
      }
    }
    
    return { success: true, message: 'Alocação atualizada com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar alocação' }
  }
}

/**
 * Remover alocação
 */
export async function removerAlocacao(alocacaoId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar se alocação existe e buscar período
    const { data: alocacao, error: fetchError } = await supabase
      .from('escala_alocacoes')
      .select('id, periodo_id')
      .eq('id', alocacaoId)
      .single()
    
    if (fetchError || !alocacao) {
      return { success: false, error: 'Alocação não encontrada' }
    }
    
    // Verificar se período está em pre_escala
    const { data: periodo, error: periodoError } = await supabase
      .from('escala_periodos')
      .select('estado')
      .eq('id', alocacao.periodo_id)
      .single()
    
    if (periodoError || !periodo) {
      return { success: false, error: 'Período não encontrado' }
    }
    
    if (periodo.estado !== 'pre_escala') {
      return { success: false, error: 'Não é possível remover alocações de período publicado. Despublique primeiro.' }
    }
    
    // Remover
    const { error } = await supabase
      .from('escala_alocacoes')
      .delete()
      .eq('id', alocacaoId)
    
    if (error) {
      console.error('Erro ao remover alocação:', error)
      return { success: false, error: 'Erro ao remover alocação' }
    }
    
    revalidatePath('/escalas')
    return { success: true, message: 'Alocação removida com sucesso' }
  } catch (error) {
    console.error('Erro ao remover alocação:', error)
    return { success: false, error: 'Erro ao remover alocação' }
  }
}

/**
 * Verificar conflitos de horário para um profissional
 * Busca alocações em períodos PUBLICADOS que se sobrepõem
 */
export async function verificarConflitos(
  profissionalId: string,
  dataInicio: string,
  dataFim: string,
  excludeAlocacaoId?: string
): Promise<EscalaAlocacao[]> {
  try {
    const supabase = await createClient()
    
    // Buscar alocações do profissional que conflitam
    // Apenas em períodos publicados (pre_escala pode ter conflitos)
    const { data, error } = await supabase
      .from('escala_alocacoes')
      .select(`
        *,
        escala_periodos!inner (
          estado
        )
      `)
      .eq('profissional_id', profissionalId)
      .eq('escala_periodos.estado', 'publicada')
      .lt('data_inicio', dataFim)
      .gt('data_fim', dataInicio)
    
    if (error) {
      console.error('Erro ao verificar conflitos:', error)
      return []
    }
    
    let conflitos = data || []
    
    // Excluir alocação sendo editada
    if (excludeAlocacaoId) {
      conflitos = conflitos.filter(a => a.id !== excludeAlocacaoId)
    }
    
    return conflitos as EscalaAlocacao[]
  } catch (error) {
    console.error('Erro ao verificar conflitos:', error)
    return []
  }
}

/**
 * Buscar profissionais ativos para select
 */
export async function buscarProfissionaisParaSelect(): Promise<Array<{ value: string; label: string }>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profissionais')
      .select(`
        id,
        nome,
        grupo_id,
        grupos (
          nome,
          tipo
        )
      `)
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return []
    }
    
    return (data || []).map((p: any) => ({
      value: p.id,
      label: `${p.nome} - ${p.grupos?.nome || ''} (${p.grupos?.tipo || ''})`
    }))
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error)
    return []
  }
}


