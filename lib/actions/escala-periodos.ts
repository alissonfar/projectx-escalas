'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { escalaPeriodoSchemaCompleto, type EscalaPeriodoFormData } from '@/lib/validations/escala-periodo'
import type { EscalaPeriodo, EscalaPeriodoCompleto, Setor, Hospital } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Buscar ou criar escala para um setor
 * Uma escala é um container contínuo (relação 1:1 com setor)
 */
export async function obterOuCriarEscalaSetor(setorId: string): Promise<{ success: boolean; escalaId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Tentar buscar escala existente
    const { data: escalaExistente, error: fetchError } = await supabase
      .from('escalas')
      .select('id')
      .eq('setor_id', setorId)
      .single()
    
    if (escalaExistente) {
      return { success: true, escalaId: escalaExistente.id }
    }
    
    // Se não existe, criar
    const { data: novaEscala, error: createError } = await supabase
      .from('escalas')
      .insert({ setor_id: setorId })
      .select('id')
      .single()
    
    if (createError || !novaEscala) {
      console.error('Erro ao criar escala:', createError)
      return { success: false, error: 'Erro ao criar escala para o setor' }
    }
    
    return { success: true, escalaId: novaEscala.id }
  } catch (error) {
    console.error('Erro ao obter/criar escala:', error)
    return { success: false, error: 'Erro ao obter escala' }
  }
}

/**
 * Buscar período de um setor para um mês/ano específico
 * Retorna a versão mais recente
 */
export async function buscarPeriodo(
  setorId: string,
  mes: number,
  ano: number
): Promise<EscalaPeriodoCompleto | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('escala_periodos')
      .select(`
        *,
        escalas!inner (
          *,
          setores!inner (
            *,
            hospitais (
              *
            )
          )
        )
      `)
      .eq('escalas.setores.id', setorId)
      .eq('mes', mes)
      .eq('ano', ano)
      .order('versao', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return {
      ...data,
      escala: {
        ...(data as any).escalas,
        setor: {
          ...(data as any).escalas.setores,
          hospital: (data as any).escalas.setores.hospitais
        }
      }
    } as EscalaPeriodoCompleto
  } catch (error) {
    console.error('Erro ao buscar período:', error)
    return null
  }
}

/**
 * Criar ou obter período para um setor
 * Se não existir, cria automaticamente como pre_escala
 */
export async function criarOuObterPeriodo(
  setorId: string,
  mes: number,
  ano: number
): Promise<{ success: boolean; periodoId?: string; estado?: EscalaPeriodoEstado; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    // 1. Obter ou criar escala do setor
    const escalaResult = await obterOuCriarEscalaSetor(setorId)
    if (!escalaResult.success || !escalaResult.escalaId) {
      return { success: false, error: escalaResult.error || 'Erro ao obter escala' }
    }
    
    // 2. Buscar período existente (versão mais recente) COM ESTADO
    const { data: periodoExistente, error: fetchError } = await supabase
      .from('escala_periodos')
      .select('id, estado')  // ✅ Incluir estado
      .eq('escala_id', escalaResult.escalaId)
      .eq('mes', mes)
      .eq('ano', ano)
      .order('versao', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (periodoExistente) {
      return { 
        success: true, 
        periodoId: periodoExistente.id,
        estado: periodoExistente.estado as EscalaPeriodoEstado  // ✅ Retornar estado real
      }
    }
    
    // 3. Se não existe, criar versão 1 como pre_escala
    const { data: novoPeriodo, error: createError } = await supabase
      .from('escala_periodos')
      .insert({
        escala_id: escalaResult.escalaId,
        mes,
        ano,
        versao: 1,
        estado: 'pre_escala',
        created_by: user.id
      })
      .select('id, estado')  // ✅ Incluir estado
      .single()
    
    if (createError || !novoPeriodo) {
      console.error('Erro ao criar período:', createError)
      return { success: false, error: 'Erro ao criar período' }
    }
    
    revalidatePath('/escalas')
    return { 
      success: true, 
      periodoId: novoPeriodo.id,
      estado: novoPeriodo.estado as EscalaPeriodoEstado  // ✅ Retornar estado do novo
    }
  } catch (error) {
    console.error('Erro ao criar/obter período:', error)
    return { success: false, error: 'Erro ao processar período' }
  }
}

/**
 * Publicar período (mudar estado de pre_escala para publicada)
 */
export async function publicarPeriodo(periodoId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }
    
    // Verificar se período existe e está em pre_escala
    const { data: periodo, error: fetchError } = await supabase
      .from('escala_periodos')
      .select('id, estado')
      .eq('id', periodoId)
      .single()
    
    if (fetchError || !periodo) {
      return { success: false, error: 'Período não encontrado' }
    }
    
    if (periodo.estado !== 'pre_escala') {
      return { success: false, error: 'Apenas períodos em pré-escala podem ser publicados' }
    }
    
    // Publicar
    const { error } = await supabase
      .from('escala_periodos')
      .update({
        estado: 'publicada',
        publicado_em: new Date().toISOString(),
        publicado_por: user.id
      })
      .eq('id', periodoId)
    
    if (error) {
      console.error('Erro ao publicar período:', error)
      return { success: false, error: 'Erro ao publicar período' }
    }
    
    revalidatePath('/escalas')
    return { success: true, message: 'Período publicado com sucesso' }
  } catch (error) {
    console.error('Erro ao publicar período:', error)
    return { success: false, error: 'Erro ao publicar período' }
  }
}

/**
 * Despublicar período (voltar para pre_escala)
 * Permite edição de período já publicado
 */
export async function despublicarPeriodo(periodoId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar se período existe e está publicado
    const { data: periodo, error: fetchError } = await supabase
      .from('escala_periodos')
      .select('id, estado')
      .eq('id', periodoId)
      .single()
    
    if (fetchError || !periodo) {
      return { success: false, error: 'Período não encontrado' }
    }
    
    if (periodo.estado !== 'publicada') {
      return { success: false, error: 'Apenas períodos publicados podem ser despublicados' }
    }
    
    // Despublicar
    const { error } = await supabase
      .from('escala_periodos')
      .update({
        estado: 'pre_escala',
        publicado_em: null,
        publicado_por: null
      })
      .eq('id', periodoId)
    
    if (error) {
      console.error('Erro ao despublicar período:', error)
      return { success: false, error: 'Erro ao despublicar período' }
    }
    
    revalidatePath('/escalas')
    return { success: true, message: 'Período despublicado com sucesso' }
  } catch (error) {
    console.error('Erro ao despublicar período:', error)
    return { success: false, error: 'Erro ao despublicar período' }
  }
}

/**
 * Buscar todos os setores da organização ativa
 */
export async function buscarSetoresOrganizacao(): Promise<Array<Setor & { hospital: Hospital }>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('setores')
      .select(`
        *,
        hospitais (
          *
        )
      `)
      .eq('ativo', true)
      .order('nome', { ascending: true })
    
    if (error) {
      console.error('Erro ao buscar setores:', error)
      return []
    }
    
    return (data || []).map((item: any) => ({
      ...item,
      hospital: item.hospitais
    }))
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    return []
  }
}


