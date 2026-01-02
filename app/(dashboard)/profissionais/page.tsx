import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfissionalList } from '@/components/profissionais/ProfissionalList'
import { buscarProfissionais } from '@/lib/actions/profissionais'

export default async function ProfissionaisPage() {
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

  const profissionais = await buscarProfissionais()

  return <ProfissionalList profissionais={profissionais} />
}




