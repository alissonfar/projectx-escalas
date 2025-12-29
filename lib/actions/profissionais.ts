'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { profissionalSchema, type ProfissionalFormData } from '@/lib/validations/profissional'
import { canDeactivateProfissional } from '@/lib/utils/validations'
import type { Profissional, Grupo } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

export type ProfissionalComGrupo = Profissional & {
  grupo: Grupo
}

/**
 * Criar novo profissional
 */
export async function criarProfissional(data: ProfissionalFormData): Promise<ActionResult> {
  try {
    const validated = profissionalSchema.parse(data)
    
    const supabase = await createClient()
    
    // Verificar se grupo pertence à organização ativa
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_ativa_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organizacao_ativa_id) {
      return { success: false, error: 'Nenhuma organização ativa selecionada' }
    }

    // Verificar se grupo pertence à organização
    const { data: grupo } = await supabase
      .from('grupos')
      .select('organizacao_id')
      .eq('id', validated.grupo_id)
      .single()

    if (!grupo || grupo.organizacao_id !== profile.organizacao_ativa_id) {
      return { success: false, error: 'Grupo não encontrado ou não pertence à organização' }
    }

    // Criar profissional (trigger valida email único)
    const { error } = await supabase
      .from('profissionais')
      .insert({
        nome: validated.nome.trim(),
        email: validated.email.trim().toLowerCase(),
        telefone: validated.telefone?.trim() || null,
        grupo_id: validated.grupo_id,
        ativo: true,
      })

    if (error) {
      if (error.message.includes('Email já cadastrado')) {
        return { success: false, error: 'Email já cadastrado nesta organização' }
      }
      console.error('Erro ao criar profissional:', error)
      return { success: false, error: 'Erro ao criar profissional' }
    }

    revalidatePath('/profissionais')
    return { success: true, message: 'Profissional criado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar profissional' }
  }
}

/**
 * Atualizar profissional existente
 */
export async function atualizarProfissional(id: string, data: ProfissionalFormData): Promise<ActionResult> {
  try {
    const validated = profissionalSchema.parse(data)
    
    const supabase = await createClient()
    
    const { data: profissional, error: fetchError } = await supabase
      .from('profissionais')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !profissional) {
      return { success: false, error: 'Profissional não encontrado' }
    }

    // Verificar se novo grupo pertence à organização
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_ativa_id')
      .eq('id', user.id)
      .single()

    if (profile?.organizacao_ativa_id) {
      const { data: grupo } = await supabase
        .from('grupos')
        .select('organizacao_id')
        .eq('id', validated.grupo_id)
        .single()

      if (!grupo || grupo.organizacao_id !== profile.organizacao_ativa_id) {
        return { success: false, error: 'Grupo não pertence à organização' }
      }
    }

    // Atualizar (trigger valida email único)
    const { error } = await supabase
      .from('profissionais')
      .update({
        nome: validated.nome.trim(),
        email: validated.email.trim().toLowerCase(),
        telefone: validated.telefone?.trim() || null,
        grupo_id: validated.grupo_id,
      })
      .eq('id', id)

    if (error) {
      if (error.message.includes('Email já cadastrado')) {
        return { success: false, error: 'Email já cadastrado nesta organização' }
      }
      console.error('Erro ao atualizar profissional:', error)
      return { success: false, error: 'Erro ao atualizar profissional' }
    }

    revalidatePath('/profissionais')
    return { success: true, message: 'Profissional atualizado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar profissional' }
  }
}

/**
 * Desativar profissional (soft delete)
 */
export async function desativarProfissional(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const validation = await canDeactivateProfissional(id)
    if (!validation.can) {
      return { success: false, error: validation.reason || 'Não é possível desativar o profissional' }
    }

    const { error } = await supabase
      .from('profissionais')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar profissional:', error)
      return { success: false, error: 'Erro ao desativar profissional' }
    }

    revalidatePath('/profissionais')
    return { success: true, message: 'Profissional desativado com sucesso' }
  } catch (error) {
    return { success: false, error: 'Erro ao desativar profissional' }
  }
}

/**
 * Buscar todos os profissionais da organização ativa com grupo
 */
export async function buscarProfissionais(): Promise<ProfissionalComGrupo[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profissionais')
      .select(`
        *,
        grupos (
          id,
          nome,
          tipo,
          organizacao_id
        )
      `)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar profissionais:', error)
      return []
    }

    return (data as any[]).map(item => ({
      ...item,
      grupo: item.grupos
    })) as ProfissionalComGrupo[]
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error)
    return []
  }
}

/**
 * Buscar profissional por ID
 */
export async function buscarProfissional(id: string): Promise<ProfissionalComGrupo | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('profissionais')
      .select(`
        *,
        grupos (
          id,
          nome,
          tipo,
          organizacao_id
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return {
      ...data,
      grupo: (data as any).grupos
    } as ProfissionalComGrupo
  } catch (error) {
    return null
  }
}

/**
 * Buscar grupos para select
 */
export async function buscarGruposParaSelect(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('grupos')
      .select('id, nome, tipo')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      return []
    }

    return (data || []).map(g => ({
      value: g.id,
      label: `${g.nome} (${g.tipo})`
    }))
  } catch (error) {
    return []
  }
}

