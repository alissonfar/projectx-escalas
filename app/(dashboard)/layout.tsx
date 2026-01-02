import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import type { Organizacao } from '@/types/database'

export default async function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Buscar profile com organização ativa
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizacoes:organizacao_ativa_id(*)')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organizacao_ativa_id) {
    redirect('/selecionar-organizacao')
  }

  // Buscar todas as organizações do usuário para o seletor
  const { data: organizacoes } = await supabase
    .from('organizacoes')
    .select('*')
    .eq('criado_por', user.id)
    .eq('ativo', true)
    .order('nome')

  // Mapear para garantir compatibilidade de tipos (ativo e created_at sempre presentes)
  const organizacoesMapeadas: Organizacao[] = (organizacoes || []).map(org => ({
    ...org,
    ativo: org.ativo ?? true, // Garantir que ativo seja sempre boolean
    created_at: org.created_at ?? new Date().toISOString() // Garantir que created_at seja sempre string
  }))

  return (
    <DashboardLayout
      user={user}
      profile={profile}
      organizacoes={organizacoesMapeadas}
    >
      {children}
    </DashboardLayout>
  )
}



