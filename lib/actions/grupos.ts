'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { grupoSchema, type GrupoFormData } from '@/lib/validations/grupo'
import { canDeactivateGrupo } from '@/lib/utils/validations'
import type { Grupo } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Criar novo grupo
 */
export async function criarGrupo(data: GrupoFormData): Promise<ActionResult> {
  try {
    const validated = grupoSchema.parse(data)
    
    const supabase = await createClient()
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

    // Criar grupo
    const { error } = await supabase
      .from('grupos')
      .insert({
        nome: validated.nome.trim(),
        tipo: validated.tipo,
        organizacao_id: profile.organizacao_ativa_id,
        ativo: true,
      })

    if (error) {
      console.error('Erro ao criar grupo:', error)
      return { success: false, error: 'Erro ao criar grupo' }
    }

    revalidatePath('/grupos')
    return { success: true, message: 'Grupo criado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar grupo' }
  }
}

/**
 * Atualizar grupo existente
 */
export async function atualizarGrupo(id: string, data: GrupoFormData): Promise<ActionResult> {
  try {
    const validated = grupoSchema.parse(data)
    
    const supabase = await createClient()
    
    const { data: grupo, error: fetchError } = await supabase
      .from('grupos')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !grupo) {
      return { success: false, error: 'Grupo não encontrado' }
    }

    // Atualizar
    const { error } = await supabase
      .from('grupos')
      .update({
        nome: validated.nome.trim(),
        tipo: validated.tipo,
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar grupo:', error)
      return { success: false, error: 'Erro ao atualizar grupo' }
    }

    revalidatePath('/grupos')
    return { success: true, message: 'Grupo atualizado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar grupo' }
  }
}

/**
 * Desativar grupo (soft delete)
 */
export async function desativarGrupo(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const validation = await canDeactivateGrupo(id)
    if (!validation.can) {
      return { success: false, error: validation.reason || 'Não é possível desativar o grupo' }
    }

    const { error } = await supabase
      .from('grupos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar grupo:', error)
      return { success: false, error: 'Erro ao desativar grupo' }
    }

    revalidatePath('/grupos')
    return { success: true, message: 'Grupo desativado com sucesso' }
  } catch (error) {
    return { success: false, error: 'Erro ao desativar grupo' }
  }
}

/**
 * Buscar todos os grupos da organização ativa
 */
export async function buscarGrupos(): Promise<Grupo[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar grupos:', error)
      return []
    }

    return (data as Grupo[]) || []
  } catch (error) {
    console.error('Erro ao buscar grupos:', error)
    return []
  }
}

/**
 * Buscar grupo por ID
 */
export async function buscarGrupo(id: string): Promise<Grupo | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Grupo
  } catch (error) {
    return null
  }
}

