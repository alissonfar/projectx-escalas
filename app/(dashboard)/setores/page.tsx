import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetorList } from '@/components/setores/SetorList'
import { buscarSetores } from '@/lib/actions/setores'

export default async function SetoresPage() {
  const supabase = await createClient()
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Verificar organização ativa
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizacao_ativa_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organizacao_ativa_id) {
    redirect('/selecionar-organizacao')
  }

  // Buscar setores
  const setores = await buscarSetores()

  return <SetorList setores={setores} />
}




