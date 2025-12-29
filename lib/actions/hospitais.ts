'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { hospitalSchema, type HospitalFormData } from '@/lib/validations/hospital'
import { canDeactivateHospital } from '@/lib/utils/validations'
import type { Hospital } from '@/types/database'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Criar novo hospital
 */
export async function criarHospital(data: HospitalFormData): Promise<ActionResult> {
  try {
    // Validar dados
    const validated = hospitalSchema.parse(data)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Buscar organização ativa do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_ativa_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organizacao_ativa_id) {
      return { success: false, error: 'Nenhuma organização ativa selecionada' }
    }

    // Criar hospital
    const { error } = await supabase
      .from('hospitais')
      .insert({
        nome: validated.nome.trim(),
        organizacao_id: profile.organizacao_ativa_id,
        ativo: true,
      })

    if (error) {
      console.error('Erro ao criar hospital:', error)
      return { success: false, error: 'Erro ao criar hospital' }
    }

    revalidatePath('/dashboard/hospitais')
    return { success: true, message: 'Hospital criado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao criar hospital' }
  }
}

/**
 * Atualizar hospital existente
 */
export async function atualizarHospital(id: string, data: HospitalFormData): Promise<ActionResult> {
  try {
    const validated = hospitalSchema.parse(data)
    
    const supabase = await createClient()
    
    // Verificar se hospital existe e pertence à organização ativa
    const { data: hospital, error: fetchError } = await supabase
      .from('hospitais')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !hospital) {
      return { success: false, error: 'Hospital não encontrado' }
    }

    // Atualizar
    const { error } = await supabase
      .from('hospitais')
      .update({
        nome: validated.nome.trim(),
      })
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar hospital:', error)
      return { success: false, error: 'Erro ao atualizar hospital' }
    }

    revalidatePath('/dashboard/hospitais')
    return { success: true, message: 'Hospital atualizado com sucesso' }
  } catch (error: any) {
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || 'Dados inválidos' }
    }
    return { success: false, error: 'Erro ao atualizar hospital' }
  }
}

/**
 * Desativar hospital (soft delete)
 */
export async function desativarHospital(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    // Verificar dependências
    const validation = await canDeactivateHospital(id)
    if (!validation.can) {
      return { success: false, error: validation.reason || 'Não é possível desativar o hospital' }
    }

    // Desativar
    const { error } = await supabase
      .from('hospitais')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar hospital:', error)
      return { success: false, error: 'Erro ao desativar hospital' }
    }

    revalidatePath('/dashboard/hospitais')
    return { success: true, message: 'Hospital desativado com sucesso' }
  } catch (error) {
    return { success: false, error: 'Erro ao desativar hospital' }
  }
}

/**
 * Buscar todos os hospitais da organização ativa
 */
export async function buscarHospitais(): Promise<Hospital[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('hospitais')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      console.error('Erro ao buscar hospitais:', error)
      return []
    }

    return (data as Hospital[]) || []
  } catch (error) {
    console.error('Erro ao buscar hospitais:', error)
    return []
  }
}

/**
 * Buscar hospital por ID
 */
export async function buscarHospital(id: string): Promise<Hospital | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('hospitais')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as Hospital
  } catch (error) {
    return null
  }
}

