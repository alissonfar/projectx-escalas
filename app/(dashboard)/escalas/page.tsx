import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EscalaList } from '@/components/escalas/EscalaList'
import { buscarEscalas } from '@/lib/actions/escalas'

export default async function EscalasPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizacao_ativa_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organizacao_ativa_id) {
    redirect('/selecionar-organizacao')
  }

  const escalas = await buscarEscalas()

  return <EscalaList escalas={escalas} />
}

