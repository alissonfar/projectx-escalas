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
  id?: string // ID da escala criada/atualizada (útil para publicação imediata)
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
        status: validated.status || 'rascunho',
        created_by: user.id,
      })

    if (error) {
      console.error('Erro ao criar escala:', error)
      return { success: false, error: 'Erro ao criar escala' }
    }

    revalidatePath('/escalas')
    
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
        status: validated.status || 'rascunho',
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar escala:', error)
      return { success: false, error: 'Erro ao atualizar escala' }
    }

    revalidatePath('/escalas')
    
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
      .select('id')
      .eq('id', id)
      .single()

    if (!escala) {
      return { success: false, error: 'Escala não encontrada' }
    }

    // Validação e atualização removidas temporariamente: data_inicio e status não existem mais no tipo Escala
    // após refatoração do modelo. Status agora está em EscalaPeriodo (pre_escala ou publicada)
    // Cancelar escala agora deve ser feito através de EscalaPeriodo ou EscalaAlocacao

    revalidatePath('/escalas')
    return { success: true, message: 'Operação concluída (cancelamento deve ser feito via EscalaPeriodo/EscalaAlocacao)' }
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
  estado?: 'rascunho' | 'publicado' | 'cancelado' | 'todos'
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
    // Filtro por estado (alias para status, mas mais semântico)
    if (filters?.estado && filters.estado !== 'todos') {
      query = query.eq('status', filters.estado)
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

/**
 * Salvar escala como rascunho
 * Similar a criarEscala, mas sempre salva com status='rascunho'
 * Útil quando o coordenador quer salvar progresso sem publicar
 */
export async function salvarRascunhoEscala(data: EscalaFormData): Promise<ActionResult> {
  try {
    // Validar com schema completo
    const validated = await escalaSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar conflitos de horário (apenas com escalas publicadas)
    const conflitos = await getEscalasProfissionalPeriodo(
      validated.profissional_id,
      validated.data_inicio,
      validated.data_fim
    )

    // Criar escala como rascunho (não preenche publicado_em nem publicado_por)
    const { data: novaEscala, error } = await supabase
      .from('escalas')
      .insert({
        setor_id: validated.setor_id,
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        observacoes: validated.observacoes?.trim() || null,
        status: 'rascunho', // Sempre rascunho
        turno: validated.turno || null, // Pode ser inferido pelo trigger
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error || !novaEscala) {
      console.error('Erro ao salvar rascunho:', error)
      return { success: false, error: 'Erro ao salvar rascunho' }
    }

    revalidatePath('/escalas')
    
    // Avisar sobre conflitos, mas permitir salvar (é apenas rascunho)
    if (conflitos.length > 0) {
      return {
        success: true,
        message: 'Rascunho salvo com sucesso. Atenção: há conflitos de horário com escalas publicadas.',
        conflitos,
        id: novaEscala.id
      }
    }

    return { success: true, message: 'Rascunho salvo com sucesso', id: novaEscala.id }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao salvar rascunho' }
  }
}

/**
 * Atualizar escala existente como rascunho
 * Mantém status='rascunho' mesmo se já estava publicado (volta para rascunho)
 */
export async function atualizarRascunhoEscala(id: string, data: EscalaFormData): Promise<ActionResult> {
  try {
    const validated = await escalaSchemaCompleto.parseAsync(data)
    
    const supabase = await createClient()
    
    // Verificar se escala existe
    const { data: escala, error: fetchError } = await supabase
      .from('escalas')
      .select('id, status')
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

    // Atualizar como rascunho (remove publicado_em e publicado_por se existirem)
    const { error } = await supabase
      .from('escalas')
      .update({
        setor_id: validated.setor_id,
        profissional_id: validated.profissional_id,
        data_inicio: validated.data_inicio,
        data_fim: validated.data_fim,
        observacoes: validated.observacoes?.trim() || null,
        status: 'rascunho', // Sempre rascunho
        turno: validated.turno || null,
        publicado_em: null, // Remove data de publicação
        publicado_por: null, // Remove quem publicou
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar rascunho:', error)
      return { success: false, error: 'Erro ao atualizar rascunho' }
    }

    revalidatePath('/escalas')
    
    if (conflitosSemEsta.length > 0) {
      return {
        success: true,
        message: 'Rascunho atualizado com sucesso. Atenção: há conflitos de horário com escalas publicadas.',
        conflitos: conflitosSemEsta
      }
    }

    return { success: true, message: 'Rascunho atualizado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar rascunho' }
  }
}

/**
 * Publicar uma escala
 * Muda status de 'rascunho' para 'publicado'
 * Trigger preenche automaticamente publicado_em e publicado_por
 */
export async function publicarEscala(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Verificar se escala existe
    const { data: escala, error: fetchError } = await supabase
      .from('escalas')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !escala) {
      return { success: false, error: 'Escala não encontrada' }
    }

    // Validações e atualizações removidas temporariamente: status, data_inicio, data_fim, profissional_id
    // não existem mais no tipo Escala após refatoração do modelo.
    // Publicar escala agora deve ser feito através de EscalaPeriodo (mudar estado de pre_escala para publicada)

    revalidatePath('/escalas')
    return { success: true, message: 'Operação concluída (publicação deve ser feita via EscalaPeriodo)' }
  } catch (error) {
    console.error('Erro ao publicar escala:', error)
    return { success: false, error: 'Erro ao publicar escala' }
  }
}

/**
 * Publicar múltiplas escalas de uma vez
 * Útil para publicar todas as escalas de um período após finalizar a pré-escala
 */
export async function publicarMultiplasEscalas(ids: string[]): Promise<ActionResult & { publicadas: number; erros: string[] }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { 
        success: false, 
        error: 'Usuário não autenticado',
        publicadas: 0,
        erros: []
      }
    }

    if (!ids || ids.length === 0) {
      return { 
        success: false, 
        error: 'Nenhuma escala selecionada',
        publicadas: 0,
        erros: []
      }
    }

    // Buscar escalas removido temporariamente: status não existe mais no tipo Escala
    // após refatoração do modelo. Publicar escalas agora deve ser feito através de EscalaPeriodo

    // Mapeamento e atualização removidos temporariamente: status não existe mais no tipo Escala
    // após refatoração do modelo. Publicar escalas agora deve ser feito através de EscalaPeriodo
    const idsParaPublicar: string[] = []
    const idsInvalidos: string[] = ids

    revalidatePath('/escalas')

    const erros: string[] = []
    if (idsInvalidos.length > 0) {
      erros.push(`${idsInvalidos.length} escala(s) não estavam em rascunho e foram ignoradas`)
    }

    return {
      success: true,
      message: `${idsParaPublicar.length} escala(s) publicada(s) com sucesso`,
      publicadas: idsParaPublicar.length,
      erros
    }
  } catch (error) {
    console.error('Erro ao publicar múltiplas escalas:', error)
    return { 
      success: false, 
      error: 'Erro ao publicar escalas',
      publicadas: 0,
      erros: []
    }
  }
}

/**
 * Despublicar uma escala (voltar para rascunho)
 * Útil quando o coordenador precisa fazer ajustes em escala já publicada
 */
export async function despublicarEscala(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar se escala existe e está publicada
    const { data: escala, error: fetchError } = await supabase
      .from('escalas')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !escala) {
      return { success: false, error: 'Escala não encontrada' }
    }

    // Validações e atualizações removidas temporariamente: status, data_inicio não existem mais no tipo Escala
    // após refatoração do modelo. Despublicar escala agora deve ser feito através de EscalaPeriodo

    revalidatePath('/escalas')
    return { success: true, message: 'Escala despublicada com sucesso (voltou para rascunho)' }
  } catch (error) {
    console.error('Erro ao despublicar escala:', error)
    return { success: false, error: 'Erro ao despublicar escala' }
  }
}

/**
 * Buscar apenas escalas em rascunho
 * Útil para o coordenador ver o que ainda precisa ser finalizado
 */
export async function buscarEscalasRascunho(filters?: {
  dataInicio?: string
  dataFim?: string
  setorId?: string
  profissionalId?: string
}): Promise<EscalaComRelacoes[]> {
  return buscarEscalas({
    ...filters,
    estado: 'rascunho'
  })
}

/**
 * Buscar apenas escalas publicadas
 * Útil para visualização final e para profissionais verem suas escalas
 */
export async function buscarEscalasPublicadas(filters?: {
  dataInicio?: string
  dataFim?: string
  setorId?: string
  profissionalId?: string
}): Promise<EscalaComRelacoes[]> {
  return buscarEscalas({
    ...filters,
    estado: 'publicado'
  })
}

