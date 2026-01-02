/**
 * Server actions para autenticação
 * Centraliza a lógica de autenticação do lado servidor
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActionResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Faz login do usuário
 */
export async function loginAction(email: string, password: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: 'Email ou senha incorretos',
      }
    }

    // Verificar se usuário tem organização ativa
    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_ativa_id')
      .eq('id', data.user.id)
      .single()

    revalidatePath('/', 'layout')
    
    if (!profile?.organizacao_ativa_id) {
      redirect('/selecionar-organizacao')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao fazer login. Tente novamente.',
    }
  }
}

/**
 * Registra novo usuário
 */
export async function signupAction(
  nomeCompleto: string,
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return {
          success: false,
          error: 'Este email já está cadastrado',
        }
      }
      return {
        success: false,
        error: 'Erro ao criar conta. Tente novamente.',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/selecionar-organizacao?novo=true')
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao criar conta. Tente novamente.',
    }
  }
}

/**
 * Faz logout do usuário
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao fazer logout',
    }
  }
}

/**
 * Cria nova organização
 */
export async function criarOrganizacaoAction(nome: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }

    // Criar organização
    const { data: novaOrg, error: createError } = await supabase
      .from('organizacoes')
      .insert({
        nome: nome.trim(),
        criado_por: user.id,
        ativo: true,
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: 'Erro ao criar organização',
      }
    }

    // Definir como organização ativa
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ organizacao_ativa_id: (novaOrg as any).id })
      .eq('id', user.id)

    if (updateError) {
      return {
        success: false,
        error: 'Erro ao definir organização ativa',
      }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao criar organização',
    }
  }
}

/**
 * Troca organização ativa
 */
export async function trocarOrganizacaoAction(orgId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
      }
    }

    // Atualizar organização ativa
    const { error } = await supabase
      .from('profiles')
      .update({ organizacao_ativa_id: orgId })
      .eq('id', user.id)

    if (error) {
      return {
        success: false,
        error: 'Erro ao selecionar organização',
      }
    }

    revalidatePath('/', 'layout')
    
    return {
      success: true,
      message: 'Organização alterada com sucesso',
    }
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao selecionar organização',
    }
  }
}

/**
 * Busca organizações do usuário
 */
export async function buscarOrganizacoesAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { organizacoes: [], error: 'Usuário não autenticado' }
    }

    const { data, error } = await supabase
      .from('organizacoes')
      .select('*')
      .eq('criado_por', user.id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) {
      return { organizacoes: [], error: 'Erro ao carregar organizações' }
    }

    return { organizacoes: data || [], error: null }
  } catch (error) {
    return { organizacoes: [], error: 'Erro ao carregar organizações' }
  }
}




