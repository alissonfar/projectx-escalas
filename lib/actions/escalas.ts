'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { escalaSchemaCompleto, type EscalaFormData } from '@/lib/validations/escala'
import { getEscalasProfissionalPeriodo } from '@/lib/supabase/queries'
import type { Escala, Setor, Profissional, Hospital, Grupo } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
  conflitos?: Escala[]
}

export type EscalaComRelacoes = Escala & {
  setor: Setor & {
    hospital: Hospital
  }
  profissional: Profissional & {
    grupo: Grupo
  }
}

/**
 * Criar nova escala
 */
export async function criarEscala(data: EscalaFormData): Promise<ActionResult> {
  try {
    // Validar com schema completo (inclui validação assíncrona de organização)
    const validated = await escalaSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar conflitos de horário
    const conflitos = await getEscalasProfissionalPeriodo(
      validated.profissional_id,
      validated.data_inicio,
      validated.data_fim
    )

    // Criar escala (mesmo com conflitos, permite salvar)
    const { error } = await supabase
      .from('escalas')
      .insert({
        setor_id: validated.setor_id,
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        observacoes: validated.observacoes?.trim() || null,
        status: validated.status || 'confirmado',
        created_by: user.id,
      })

    if (error) {
      console.error('Erro ao criar escala:', error)
      return { success: false, error: 'Erro ao criar escala' }
    }

    revalidatePath('/dashboard/escalas')
    
    if (conflitos.length > 0) {
      return {
        success: true,
        message: 'Escala criada com sucesso, mas há conflitos de horário',
        conflitos
      }
    }

    return { success: true, message: 'Escala criada com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar escala' }
  }
}

/**
 * Atualizar escala existente
 */
export async function atualizarEscala(id: string, data: EscalaFormData): Promise<ActionResult> {
  try {
    const validated = await escalaSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    
    const { data: escala, error: fetchError } = await supabase
      .from('escalas')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !escala) {
      return { success: false, error: 'Escala não encontrada' }
    }

    // Verificar conflitos (excluindo a própria escala)
    const conflitos = await getEscalasProfissionalPeriodo(
      validated.profissional_id,
      validated.data_inicio,
      validated.data_fim
    )
    const conflitosSemEsta = conflitos.filter(c => c.id !== id)

    // Atualizar
    const { error } = await supabase
      .from('escalas')
      .update({
        setor_id: validated.setor_id,
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        observacoes: validated.observacoes?.trim() || null,
        status: validated.status || 'confirmado',
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar escala:', error)
      return { success: false, error: 'Erro ao atualizar escala' }
    }

    revalidatePath('/dashboard/escalas')
    
    if (conflitosSemEsta.length > 0) {
      return {
        success: true,
        message: 'Escala atualizada com sucesso, mas há conflitos de horário',
        conflitos: conflitosSemEsta
      }
    }

    return { success: true, message: 'Escala atualizada com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar escala' }
  }
}

/**
 * Cancelar escala
 */
export async function cancelarEscala(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar se escala existe
    const { data: escala } = await supabase
      .from('escalas')
      .select('data_inicio, status')
      .eq('id', id)
      .single()

    if (!escala) {
      return { success: false, error: 'Escala não encontrada' }
    }

    // Regra: Não pode cancelar escalas passadas
    const dataInicio = new Date(escala.data_inicio)
    if (dataInicio < new Date()) {
      return { success: false, error: 'Não é possível cancelar escalas já executadas' }
    }

    // Cancelar
    const { error } = await supabase
      .from('escalas')
      .update({ status: 'cancelado' })
      .eq('id', id)

    if (error) {
      console.error('Erro ao cancelar escala:', error)
      return { success: false, error: 'Erro ao cancelar escala' }
    }

    revalidatePath('/dashboard/escalas')
    return { success: true, message: 'Escala cancelada com sucesso' }
  } catch (error) {
    return { success: false, error: 'Erro ao cancelar escala' }
  }
}

/**
 * Buscar todas as escalas da organização ativa com relacionamentos
 */
export async function buscarEscalas(filters?: {
  dataInicio?: string
  dataFim?: string
  setorId?: string
  profissionalId?: string
  status?: string
}): Promise<EscalaComRelacoes[]> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('escalas')
      .select(`
        *,
        setores (
          id,
          nome,
          hospital_id,
          hospitais (
            id,
            nome,
            organizacao_id
          )
        ),
        profissionais (
          id,
          nome,
          email,
          grupo_id,
          grupos (
            id,
            nome,
            tipo,
            organizacao_id
          )
        )
      `)

    // Aplicar filtros
    if (filters?.dataInicio) {
      query = query.gte('data_inicio', filters.dataInicio)
    }
    if (filters?.dataFim) {
      query = query.lte('data_fim', filters.dataFim)
    }
    if (filters?.setorId) {
      query = query.eq('setor_id', filters.setorId)
    }
    if (filters?.profissionalId) {
      query = query.eq('profissional_id', filters.profissionalId)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query.order('data_inicio', { ascending: true })

    if (error) {
      console.error('Erro ao buscar escalas:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      ...item,
      setor: {
        ...item.setores,
        hospital: item.setores.hospitais
      },
      profissional: {
        ...item.profissionais,
        grupo: item.profissionais.grupos
      }
    })) as EscalaComRelacoes[]
  } catch (error) {
    console.error('Erro ao buscar escalas:', error)
    return []
  }
}

/**
 * Buscar escala por ID
 */
export async function buscarEscala(id: string): Promise<EscalaComRelacoes | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('escalas')
      .select(`
        *,
        setores (
          id,
          nome,
          hospital_id,
          hospitais (
            id,
            nome,
            organizacao_id
          )
        ),
        profissionais (
          id,
          nome,
          email,
          grupo_id,
          grupos (
            id,
            nome,
            tipo,
            organizacao_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return {
      ...data,
      setor: {
        ...(data as any).setores,
        hospital: (data as any).setores.hospitais
      },
      profissional: {
        ...(data as any).profissionais,
        grupo: (data as any).profissionais.grupos
      }
    } as EscalaComRelacoes
  } catch (error) {
    return null
  }
}

/**
 * Buscar setores para select (com nome do hospital)
 */
export async function buscarSetoresParaSelect(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('setores')
      .select(`
        id,
        nome,
        hospital_id,
        hospitais (
          nome
        )
      `)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      return []
    }

    return (data || []).map((s: any) => ({
      value: s.id,
      label: `${s.nome} - ${s.hospitais?.nome || ''}`
    }))
  } catch (error) {
    return []
  }
}

/**
 * Buscar profissionais para select (com grupo)
 */
export async function buscarProfissionaisParaSelect(): Promise<{ value: string; label: string }[]> {
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
      return []
    }

    return (data || []).map((p: any) => ({
      value: p.id,
      label: `${p.nome} - ${p.grupos?.nome || ''} (${p.grupos?.tipo || ''})`
    }))
  } catch (error) {
    return []
  }
}

/**
 * Verificar conflitos de horário
 */
export async function verificarConflitos(
  profissionalId: string,
  dataInicio: string,
  dataFim: string,
  excludeId?: string
): Promise<Escala[]> {
  try {
    const conflitos = await getEscalasProfissionalPeriodo(
      profissionalId,
      dataInicio,
      dataFim
    )

    if (excludeId) {
      return conflitos.filter(c => c.id !== excludeId)
    }

    return conflitos
  } catch (error) {
    return []
  }
}

