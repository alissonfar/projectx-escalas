import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HospitalList } from '@/components/hospitais/HospitalList'
import { buscarHospitais } from '@/lib/actions/hospitais'

export default async function HospitaisPage() {
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

  // Buscar hospitais
  const hospitais = await buscarHospitais()

  return <HospitalList hospitais={hospitais} />
}

