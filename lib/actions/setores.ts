'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { setorSchema, type SetorFormData } from '@/lib/validations/setor'
import { canDeactivateSetor } from '@/lib/utils/validations'
import type { Setor, Hospital } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

export type SetorComHospital = Setor & {
  hospital: Hospital
}

/**
 * Criar novo setor
 */
export async function criarSetor(data: SetorFormData): Promise<ActionResult> {
  try {
    const validated = setorSchema.parse(data)
    
    const supabase = await createClient()
    
    // Verificar se hospital pertence à organização ativa
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

    // Verificar se hospital pertence à organização
    const { data: hospital } = await supabase
      .from('hospitais')
      .select('organizacao_id')
      .eq('id', validated.hospital_id)
      .single()

    if (!hospital || hospital.organizacao_id !== profile.organizacao_ativa_id) {
      return { success: false, error: 'Hospital não encontrado ou não pertence à organização' }
    }

    // Criar setor
    const { error } = await supabase
      .from('setores')
      .insert({
        nome: validated.nome.trim(),
        hospital_id: validated.hospital_id,
        ativo: true,
      })

    if (error) {
      console.error('Erro ao criar setor:', error)
      return { success: false, error: 'Erro ao criar setor' }
    }

    revalidatePath('/setores')
    return { success: true, message: 'Setor criado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar setor' }
  }
}

/**
 * Atualizar setor existente
 */
export async function atualizarSetor(id: string, data: SetorFormData): Promise<ActionResult> {
  try {
    const validated = setorSchema.parse(data)
    
    const supabase = await createClient()
    
    // Verificar se setor existe
    const { data: setor, error: fetchError } = await supabase
      .from('setores')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !setor) {
      return { success: false, error: 'Setor não encontrado' }
    }

    // Verificar se novo hospital pertence à organização
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
      const { data: hospital } = await supabase
        .from('hospitais')
        .select('organizacao_id')
        .eq('id', validated.hospital_id)
        .single()

      if (!hospital || hospital.organizacao_id !== profile.organizacao_ativa_id) {
        return { success: false, error: 'Hospital não pertence à organização' }
      }
    }

    // Atualizar
    const { error } = await supabase
      .from('setores')
      .update({
        nome: validated.nome.trim(),
        hospital_id: validated.hospital_id,
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar setor:', error)
      return { success: false, error: 'Erro ao atualizar setor' }
    }

    revalidatePath('/setores')
    return { success: true, message: 'Setor atualizado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar setor' }
  }
}

/**
 * Desativar setor (soft delete)
 */
export async function desativarSetor(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar dependências
    const validation = await canDeactivateSetor(id)
    if (!validation.can) {
      return { success: false, error: validation.reason || 'Não é possível desativar o setor' }
    }

    // Desativar
    const { error } = await supabase
      .from('setores')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar setor:', error)
      return { success: false, error: 'Erro ao desativar setor' }
    }

    revalidatePath('/setores')
    return { success: true, message: 'Setor desativado com sucesso' }
  } catch (error) {
    return { success: false, error: 'Erro ao desativar setor' }
  }
}

/**
 * Buscar todos os setores da organização ativa com hospital
 */
export async function buscarSetores(): Promise<SetorComHospital[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('setores')
      .select(`
        *,
        hospitais (
          id,
          nome,
          organizacao_id
        )
      `)
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar setores:', error)
      return []
    }

    return (data as any[]).map(item => ({
      ...item,
      hospital: item.hospitais
    })) as SetorComHospital[]
  } catch (error) {
    console.error('Erro ao buscar setores:', error)
    return []
  }
}

/**
 * Buscar setor por ID
 */
export async function buscarSetor(id: string): Promise<SetorComHospital | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('setores')
      .select(`
        *,
        hospitais (
          id,
          nome,
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
      hospital: (data as any).hospitais
    } as SetorComHospital
  } catch (error) {
    return null
  }
}

/**
 * Buscar hospitais para select
 */
export async function buscarHospitaisParaSelect(): Promise<{ value: string; label: string }[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('hospitais')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) {
      return []
    }

    return (data || []).map(h => ({
      value: h.id,
      label: h.nome
    }))
  } catch (error) {
    return []
  }
}

