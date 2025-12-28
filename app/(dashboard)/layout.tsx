import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

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

  return (
    <DashboardLayout
      user={user}
      profile={profile}
      organizacoes={organizacoes || []}
    >
      {children}
    </DashboardLayout>
  )
}

