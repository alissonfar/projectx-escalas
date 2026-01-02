import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GrupoList } from '@/components/grupos/GrupoList'
import { buscarGrupos } from '@/lib/actions/grupos'

export default async function GruposPage() {
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

  const grupos = await buscarGrupos()

  return <GrupoList grupos={grupos} />
}




