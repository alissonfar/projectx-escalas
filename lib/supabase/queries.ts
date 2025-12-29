/**
 * Queries auxiliares para o Supabase
 * Centraliza queries comuns usadas em múltiplos lugares
 * 
 * NOTA: Com RLS configurado, os dados já são filtrados automaticamente
 * pela organização ativa do usuário. Este helper é opcional para casos
 * especiais que precisam de filtro explícito.
 */

import { createClient } from './client'
import { Escala, Profissional, Profile } from '@/types/database'

/**
 * Helper opcional para obter filtro de organização ativa
 * 
 * NOTA: RLS já faz o filtro automaticamente via políticas.
 * Use este helper apenas em casos especiais onde seja necessário
 * filtro explícito (ex: queries que não passam pelo RLS).
 * 
 * @returns UUID da organização ativa do usuário ou null
 */
export async function getActiveOrgId(): Promise<string | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizacao_ativa_id')
    .eq('id', user.id)
    .single()
  
  return (profile as Profile | null)?.organizacao_ativa_id || null
}

/**
 * Busca escalas de um profissional que conflitam com um período específico
 * Usado para verificação de conflitos
 * 
 * Retorna escalas que se sobrepõem ao período informado.
 * 
 * Lógica de sobreposição: duas escalas se sobrepõem se:
 * - data_inicio < nova_data_fim AND data_fim > nova_data_inicio
 * 
 * Otimizado para filtrar diretamente no SQL ao invés de buscar todas e filtrar em memória.
 */
export async function getEscalasProfissionalPeriodo(
  profissionalId: string,
  dataInicio: string,
  dataFim: string
): Promise<Escala[]> {
  const supabase = createClient()
  
  // Filtrar diretamente no SQL escalas que se sobrepõem ao período
  // Lógica: data_inicio < dataFim AND data_fim > dataInicio
  const { data: escalasConflitantes, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('profissional_id', profissionalId)
    .eq('status', 'publicado')
    .lt('data_inicio', dataFim)  // data_inicio < dataFim (nova escala ainda não terminou)
    .gt('data_fim', dataInicio)  // data_fim > dataInicio (escala existente ainda não terminou)
    .order('data_inicio', { ascending: true })
  
  if (error) {
    console.error('Erro ao buscar escalas conflitantes:', error)
    return []
  }
  
  return (escalasConflitantes as Escala[]) || []
}

/**
 * Busca todas as escalas de um profissional
 */
export async function getEscalasProfissional(
  profissionalId: string
): Promise<Escala[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('escalas')
    .select('*')
    .eq('profissional_id', profissionalId)
    .order('data_inicio', { ascending: true })
  
  if (error) {
    console.error('Erro ao buscar escalas do profissional:', error)
    return []
  }
  
  return (data as Escala[]) || []
}

/**
 * Verifica se profissional e setor pertencem à mesma organização ativa do usuário
 * 
 * Validação importante para garantir que:
 * - O profissional pertence a um grupo da organização
 * - O setor pertence a um hospital da organização
 * - Ambos pertencem à mesma organização ativa do usuário
 * 
 * @param profissionalId UUID do profissional
 * @param setorId UUID do setor
 * @returns Objeto com valido: boolean e erro?: string opcional
 */
export async function verificarProfissionalSetorMesmaOrg(
  profissionalId: string,
  setorId: string
): Promise<{ valido: boolean; erro?: string }> {
  const supabase = createClient()
  
  // Obter organização ativa do usuário
  const orgAtivaId = await getActiveOrgId()
  if (!orgAtivaId) {
    return {
      valido: false,
      erro: 'Usuário não possui organização ativa',
    }
  }
  
  // Buscar profissional com seu grupo e organizacao_id
  const { data: profissional, error: errorProf } = await supabase
    .from('profissionais')
    .select(`
      id,
      grupo_id,
      grupos!inner (
        id,
        organizacao_id
      )
    `)
    .eq('id', profissionalId)
    .single()
  
  if (errorProf || !profissional) {
    return {
      valido: false,
      erro: 'Profissional não encontrado',
    }
  }
  
  const orgProfissional = (profissional as any).grupos?.organizacao_id
  if (!orgProfissional) {
    return {
      valido: false,
      erro: 'Profissional não está vinculado a uma organização',
    }
  }
  
  // Buscar setor com seu hospital e organizacao_id
  const { data: setor, error: errorSetor } = await supabase
    .from('setores')
    .select(`
      id,
      hospital_id,
      hospitais!inner (
        id,
        organizacao_id
      )
    `)
    .eq('id', setorId)
    .single()
  
  if (errorSetor || !setor) {
    return {
      valido: false,
      erro: 'Setor não encontrado',
    }
  }
  
  const orgSetor = (setor as any).hospitais?.organizacao_id
  if (!orgSetor) {
    return {
      valido: false,
      erro: 'Setor não está vinculado a uma organização',
    }
  }
  
  // Verificar se ambos pertencem à mesma organização
  if (orgProfissional !== orgSetor) {
    return {
      valido: false,
      erro: 'Profissional e setor devem pertencer à mesma organização',
    }
  }
  
  // Verificar se a organização é a ativa do usuário
  if (orgProfissional !== orgAtivaId) {
    return {
      valido: false,
      erro: 'Profissional e setor devem pertencer à organização ativa',
    }
  }
  
  return { valido: true }
}

