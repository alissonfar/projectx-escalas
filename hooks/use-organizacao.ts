import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Organizacao } from '@/types/database'

export function useOrganizacao() {
  const [organizacaoAtiva, setOrganizacaoAtiva] = useState<Organizacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOrganization, setNeedsOrganization] = useState(false)
  const supabase = createClient()

  const loadOrganizacaoAtiva = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Buscar profile com organizacao_ativa_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_ativa_id')
        .eq('id', user.id)
        .single()

      if (profile?.organizacao_ativa_id) {
        const { data: org } = await supabase
          .from('organizacoes')
          .select('*')
          .eq('id', profile.organizacao_ativa_id)
          .single()

        // Mapear para garantir compatibilidade de tipos (ativo e created_at sempre presentes)
        const orgMapeada: Organizacao | null = org ? {
          ...org,
          ativo: org.ativo ?? true,
          created_at: org.created_at ?? new Date().toISOString()
        } : null

        setOrganizacaoAtiva(orgMapeada)
        setNeedsOrganization(false)
      } else {
        // Usuário não tem organização ativa
        setOrganizacaoAtiva(null)
        setNeedsOrganization(true)
      }
    } catch (error) {
      console.error('Erro ao carregar organização ativa:', error)
      setNeedsOrganization(true)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadOrganizacaoAtiva()
  }, [loadOrganizacaoAtiva])

  // Subscription Realtime para atualização automática quando profile for atualizado
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function setupSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            // Recarregar organização quando profile for atualizado
            loadOrganizacaoAtiva()
          }
        )
        .subscribe()

      // Verificar se a subscription foi estabelecida
      // Handler de erro removido: método on() do Supabase requer 3 argumentos
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, loadOrganizacaoAtiva])

  // Função refetch para recarga manual
  const refetch = useCallback(async () => {
    await loadOrganizacaoAtiva()
  }, [loadOrganizacaoAtiva])

  return { 
    organizacaoAtiva, 
    loading, 
    needsOrganization, 
    setOrganizacaoAtiva,
    refetch 
  }
}

